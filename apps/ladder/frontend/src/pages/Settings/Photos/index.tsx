import { useCallback, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Card from '@rival/packages/components/Card';
import _omit from 'lodash/omit';
import { Redirect } from 'react-router-dom';
import classnames from 'classnames';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Formik, Field, Form } from '@/components/formik';
import Checkbox from '@/components/formik/Checkbox';
import Textarea from '@/components/formik/Textarea';
import LoaderWithProgress from '@rival/packages/components/LoaderWithProgress';
import Gallery from '@/components/Gallery';
import { useQuery, useQueryClient } from 'react-query';
import Loader from '@rival/packages/components/Loader';
import Button from '@rival/packages/components/Button';
import notification from '@/components/notification';
import useConfig from '@/utils/useConfig';
import formatSize from '@rival/packages/utils/formatSize';
import style from './style.module.scss';

let counter = 1;

const Settings = (props) => {
    const [uploadStatus, setUploadStatus] = useState({});
    const currentUser = useSelector((state) => state.auth.user);
    const queryClient = useQueryClient();
    const config = useConfig();

    const { data: photos = [], isLoading } = useQuery(`/api/users/photos`, async () => {
        const response = await axios.put('/api/users/0', { action: 'getPhotos' });
        return response.data.data;
    });

    const photosWithAuthor = useMemo(
        () => photos.map((item) => ({ ...item, author: currentUser })),
        [photos, currentUser]
    );

    const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
        let correctFiles = acceptedFiles
            .filter((file) => file.size <= config.maxPhotoSize)
            .map((file) => ({ id: counter++, payload: file }));
        const wrongFiles = rejectedFiles.map((file) => ({
            id: counter++,
            name: file.file.name,
            reason: 'Unsupported file type',
        }));

        // Check max file size
        wrongFiles.push(
            ...acceptedFiles
                .filter((file) => file.size > config.maxPhotoSize)
                .map((file) => ({
                    id: file.id,
                    name: file.name,
                    reason: `Size is bigger than ${formatSize(config.maxPhotoSize)}`,
                }))
        );

        await (async () => {
            if (correctFiles.length === 0) {
                return;
            }

            setUploadStatus(
                correctFiles.reduce((obj, file) => {
                    obj[file.id] = [0, file.payload.size];
                    return obj;
                }, {})
            );

            // getting presigned urls
            {
                const response = await axios.put(`/api/photos/0`, {
                    action: 'getPresignedUrlForPhotosUpload',
                    files: correctFiles.map((file) => ({
                        id: file.id,
                        name: file.payload.name,
                        size: file.payload.size,
                    })),
                });
                const result = response.data;

                wrongFiles.push(...result.filter((item) => item.status !== 'success'));
                correctFiles = correctFiles.filter((file, index) => {
                    if (result[index].status !== 'success') {
                        return false;
                    }

                    file.url = result[index].url;
                    file.key = result[index].key;
                    return true;
                });

                setUploadStatus((prev) =>
                    _omit(
                        prev,
                        wrongFiles.map((file) => file.id)
                    )
                );
            }

            if (correctFiles.length === 0) {
                return;
            }

            // uploading files to s3
            {
                const uploadFile = async (file) => {
                    const response = await axios.put(file.url, file.payload, {
                        headers: { 'Content-Type': file.payload.type },
                        transformRequest: [
                            (data, headers) => {
                                delete headers.Authorization;
                                return data;
                            },
                        ],
                        onUploadProgress: (progressEvent) => {
                            setUploadStatus((prev) => ({
                                ...prev,
                                [file.id]: [progressEvent.loaded, progressEvent.total],
                            }));
                        },
                    });
                    return response;
                };

                const result = await Promise.all(correctFiles.map(uploadFile));

                wrongFiles.push(
                    ...correctFiles
                        .filter((file, index) => result[index].status !== 200)
                        .map((file) => ({
                            id: file.id,
                            name: file.payload.name,
                            reason: 'Upload error',
                        }))
                );
                correctFiles = correctFiles.filter((file, index) => result[index].status === 200);

                setUploadStatus((prev) =>
                    _omit(
                        prev,
                        wrongFiles.map((file) => file.id)
                    )
                );
            }

            if (correctFiles.length === 0) {
                return;
            }

            // process photos
            {
                const result = await axios.put(`/api/photos/0`, {
                    action: 'batchProcess',
                    files: correctFiles.map((file) => ({ id: file.id, name: file.payload.name, key: file.key })),
                });

                wrongFiles.push(...result.data.filter((item) => item.status !== 'success'));
                correctFiles = correctFiles.filter((file, index) => {
                    if (result.data[index].status !== 'success') {
                        return false;
                    }

                    file.photoId = result.data[index].photoId;
                    file.thumbnail = result.data[index].url400;
                    file.width = result.data[index].width;
                    file.height = result.data[index].height;

                    return true;
                });

                setUploadStatus((prev) =>
                    _omit(
                        prev,
                        wrongFiles.map((file) => file.id)
                    )
                );
            }

            if (correctFiles.length === 0) {
                return;
            }

            // load photos again
            await queryClient.invalidateQueries('/api/users/photos');
        })();

        setUploadStatus({});

        notification({
            inModal: true,
            title: 'Upload Result',
            render: ({ hide }) => (
                <div className="text-start">
                    {wrongFiles.length > 0 && (
                        <div className="alert alert-danger mb-8">
                            <div>We are not able to upload the following photo{wrongFiles.length > 1 ? 's' : ''}:</div>
                            <ul className="ps-8 mt-2 mb-0">
                                {wrongFiles.map((file) => (
                                    <li key={file.id} className="m-0">
                                        <b>{file.name}</b> - {file.reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {correctFiles.length > 0 && (
                        <Formik
                            initialValues={correctFiles.reduce(
                                (obj, item) => {
                                    obj.permissions[item.photoId] = {
                                        allowShare: true,
                                        allowComments: true,
                                    };
                                    return obj;
                                },
                                { permissions: {} }
                            )}
                            onSubmit={async (values) => {
                                await axios.put(`/api/photos/0`, {
                                    action: 'changePermissions',
                                    ...values,
                                });
                                await queryClient.invalidateQueries('/api/users/photos');
                                hide();
                            }}
                        >
                            {({ isSubmitting, handleSubmit }) => (
                                <Form noValidate>
                                    <h3>
                                        Review {correctFiles.length} uploaded photo{correctFiles.length > 1 ? 's' : ''}
                                    </h3>
                                    <div className="text-muted mb-4">
                                        <div>
                                            <b>Shareable</b> - Allow sharing on Rival social media (Instagram, Facebook,
                                            etc.)
                                        </div>
                                        <div>
                                            <b>Comments</b> - Allow players to leave comments
                                        </div>
                                    </div>
                                    <div className={style.reviewWrapper + ' mb-6'}>
                                        {correctFiles.map((item) => (
                                            <div key={item.id} className={style.review}>
                                                <div className={style.image}>
                                                    <img src={item.thumbnail} alt="" />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <Field
                                                        name={`permissions.${item.photoId}.title`}
                                                        placeholder="Add a description..."
                                                        component={Textarea}
                                                        rows="1"
                                                        maxLength="100"
                                                        wrapperClassName="mb-4"
                                                    />
                                                    <Field
                                                        name={`permissions.${item.photoId}.allowShare`}
                                                        label="Shareable"
                                                        component={Checkbox}
                                                        className="form-check form-check-solid mb-2"
                                                        wrapperClassName=""
                                                    />
                                                    <Field
                                                        name={`permissions.${item.photoId}.allowComments`}
                                                        label="Comments"
                                                        component={Checkbox}
                                                        className="form-check form-check-solid"
                                                        wrapperClassName=""
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        isSubmitting={isSubmitting}
                                        className="btn btn-primary"
                                        onClick={handleSubmit}
                                    >
                                        Submit
                                    </Button>
                                </Form>
                            )}
                        </Formik>
                    )}
                    {correctFiles.length === 0 && (
                        <button type="button" className="btn btn-primary" onClick={hide}>
                            Ok, got it!
                        </button>
                    )}
                </div>
            ),
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        noClick: true,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
            'image/avif': ['.avif'],
            'image/heic': ['.heic'],
        },
    });

    const onPhotoDelete = async () => {
        await queryClient.invalidateQueries(`/api/users/photos`);
    };

    if (isLoading) {
        return <Loader loading />;
    }

    if (!currentUser) {
        return <Redirect to={{ pathname: '/login', search: '?redirectAfterLogin=/user/settings' }} />;
    }

    const [loaded, total] = Object.values(uploadStatus).reduce(
        (res, item) => {
            return [res[0] + item[0], res[1] + item[1]];
        },
        [0, 0]
    );
    const percent = total === 0 ? 0 : Math.floor((loaded / total) * 100);
    const showPhotoLoader = total > 0;

    const photosCount = Object.values(uploadStatus).length;

    const allowToAddPhotos = currentUser.totalMatches >= config.minMatchesToAddPhotos;

    const rules = (
        <div>
            <p>Upload any of your own photos related to tennis, such as (but not limited to):</p>
            <ul>
                <li className="m-0">You and your friends at a tennis court</li>
                <li className="m-0">Special moments at a tennis court</li>
                <li className="m-0">You with a tennis trophy</li>
                <li className="m-0">You at a tennis stadium or event</li>
                <li className="m-0">Selfie with you and a famous tennis star</li>
                <li className="m-0">Your tennis equipment</li>
                <li className="m-0">Your tennis supporters or team</li>
            </ul>
            <div>
                Please do not post other types of photos. If you upload inappropriate photos (including nudity,
                violence, drugs, etc.) you could face a ban from the system.
            </div>
        </div>
    );

    return (
        <>
            <LoaderWithProgress
                loading={showPhotoLoader}
                message={`Uploading ${photosCount} photo${photosCount > 1 ? 's' : ''}...`}
                percent={percent}
            />
            <div
                data-photos
                className={classnames(style.wrapper, isDragActive && style.isDragActive)}
                {...getRootProps()}
            >
                <input {...getInputProps()} />
                <div className={style.draggingInvitaion}>Drop photos here ...</div>

                <Card {...(photos.length > 0 ? { tooltip: <div className="text-start p-2">{rules}</div> } : {})}>
                    <h2>Tennis Frames</h2>
                    {allowToAddPhotos ? (
                        <>
                            {photos.length > 0 && (
                                <div className="mt-4">
                                    <Gallery
                                        photos={photosWithAuthor}
                                        albumProps={{ targetRowHeight: (width) => (width < 600 ? 100 : 150) }}
                                        onPhotoDelete={onPhotoDelete}
                                    />
                                </div>
                            )}
                            {photos.length === 0 && rules}
                            <div className="mt-6 d-flex align-items-center">
                                <button type="button" onClick={open} className="btn btn-secondary">
                                    Upload photos
                                </button>
                                <div className="text-muted ms-3 d-none d-sm-block">or drag photos here</div>
                            </div>
                        </>
                    ) : (
                        <div>You must play at least {config.minMatchesToAddPhotos} matches to upload photos.</div>
                    )}
                </Card>
            </div>
        </>
    );
};

export default Settings;
