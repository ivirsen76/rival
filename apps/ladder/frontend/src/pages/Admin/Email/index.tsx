import { useState } from 'react';
import Card from '@/components/Card';
import { Formik, Field, Form } from '@/components/formik';
import CheckboxArray from '@/components/formik/CheckboxArray';
import Input from '@/components/formik/Input';
import Textarea from '@/components/formik/Textarea';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useQuery } from 'react-query';
import axios from '@/utils/axios';
import _uniq from 'lodash/uniq';
import Loader from '@/components/Loader';
import notification from '@/components/notification';
import confirmation from '@/utils/confirmation';
import copy from 'clipboard-copy';
import { useSelector } from 'react-redux';
import hasAnyRole from '@/utils/hasAnyRole';
import { marked } from 'marked';
import classnames from 'classnames';
import style from './style.module.scss';

const renderer = {
    heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);

        return `<h${depth} style="margin: 1.4em 0 0.7em;">${text}</h${depth}>\n`;
    },
};
marked.use({ renderer });

const getHtml = value => {
    // make margin-top=0 for the first heading
    return marked
        .parse(value)
        .replace(/^<(h\d)[^>]+>/g, (_, tag) => `<${tag} style="margin: 0 0 0.7em;">`)
        .replace(/(.)LinkButton/g, (_, symbol) => {
            if (symbol === '/') {
                return '/a';
            }

            return '<a style="display:inline-block;background:#22bc66;color:#ffffff;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:10px 25px;border-radius:5px"';
        });
};

export const validate = values => {
    const errors = {};

    if (!values.subject.trim()) {
        errors.subject = 'Subject is required';
    } else if (!values.body.trim()) {
        errors.body = 'Content is required';
    }

    if (values.additionalRecipients) {
        const incorrectEmails = values.additionalRecipients
            .split(';')
            .map(email => email.trim())
            .filter(email => email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

        if (incorrectEmails.length > 0) {
            errors.additionalRecipients = `These emails are incorrect: ${incorrectEmails.join(', ')}`;
        }
    }

    return errors;
};

const previewModeOptions = [
    { value: 'desktop', label: 'Desktop', dialogClassName: style.desktop },
    { value: 'mobile', label: 'Mobile', dialogClassName: style.mobile },
];

const Email = props => {
    const [previewMode, setPreviewMode] = useState(previewModeOptions[0].value);
    const currentUser = useSelector(state => state.auth.user);
    const isSuperAdmin = hasAnyRole(currentUser, ['superadmin']);

    const { data, isLoading } = useQuery('getPlayersFromLastSeasons', async () => {
        const response = await axios.put('/api/seasons/0', { action: 'getPlayersFromLastSeasons' });
        return response.data;
    });

    if (isLoading) {
        return <Loader loading />;
    }

    const { seasons, all } = data;
    const currentPreviewMode = previewModeOptions.find(item => item.value === previewMode);

    const getRecipientsEmails = recipients => {
        const emails = [];
        for (const season of seasons) {
            for (const level of season.levels) {
                if (recipients.includes(`${season.id}-${level.id}`)) {
                    emails.push(...level.emails);
                }
            }
        }

        if (recipients.includes('all')) {
            emails.push(...all);
        }

        return _uniq(emails);
    };

    if (seasons.length === 0) {
        return <Card>No players yet</Card>;
    }

    const copyEmails = values => {
        const emails = getRecipientsEmails(values.recipients).sort((a, b) => a.localeCompare(b));
        copy(emails.join('; '));
        notification({
            header: 'Success',
            message: `${emails.length} emails copied to the clipboard`,
        });
    };

    const sendMessage = async values => {
        const recipientsEmails = getRecipientsEmails(values.recipients);
        const emails = recipientsEmails.map(email => ({ email }));
        if (values.additionalRecipients) {
            values.additionalRecipients
                .split(';')
                .map(email => email.trim())
                .filter(email => email && !recipientsEmails.includes(email))
                .forEach(email => {
                    emails.push({ email });
                });
        }

        const confirm = await confirmation({
            message: (
                <div>
                    You are about to send a message to {emails.length} players.
                    <br />
                    Are you sure?
                </div>
            ),
        });
        if (!confirm) {
            return;
        }

        await axios.put('/api/emails/0', {
            action: 'sendMessage',
            emails,
            subject: values.subject,
            body: getHtml(values.body),
        });

        notification({
            header: 'Success',
            message: `Message was successfuly sent to ${emails.length} recipients`,
        });
    };

    return (
        <Card>
            <p>Select player groups and copy their emails to the email client of your choice.</p>
            <Formik
                initialValues={{
                    recipients: [],
                    subject: '',
                    body: '',
                    additionalRecipients: '',
                }}
                validate={validate}
                onSubmit={sendMessage}
            >
                {({ values }) => {
                    const emails = getRecipientsEmails(values.recipients);

                    return (
                        <Form noValidate>
                            <Field
                                name="recipients"
                                render={({ field, form }) => (
                                    <>
                                        {seasons.map(season => (
                                            <div key={season.id}>
                                                <h4>{season.name}</h4>
                                                <CheckboxArray
                                                    field={field}
                                                    form={form}
                                                    options={season.levels.map(level => ({
                                                        value: `${season.id}-${level.id}`,
                                                        label: (
                                                            <span>
                                                                {level.name} players{' '}
                                                                <span className="text-black-50">
                                                                    ({level.emails.length})
                                                                </span>
                                                            </span>
                                                        ),
                                                    }))}
                                                />
                                            </div>
                                        ))}
                                        {isSuperAdmin && (
                                            <>
                                                <h4>Other groups</h4>
                                                <CheckboxArray
                                                    field={field}
                                                    form={form}
                                                    options={[
                                                        {
                                                            value: 'all',
                                                            label: (
                                                                <span>
                                                                    All players{' '}
                                                                    <span className="text-black-50">
                                                                        ({all.length})
                                                                    </span>
                                                                </span>
                                                            ),
                                                        },
                                                    ]}
                                                />
                                            </>
                                        )}
                                    </>
                                )}
                            />
                            {isSuperAdmin && (
                                <>
                                    <Field
                                        name="additionalRecipients"
                                        label="Additional emails"
                                        description="Separate by semicolon"
                                        component={Textarea}
                                    />
                                    <Field name="subject" label="Subject" component={Input} />
                                    <div>
                                        <Modal
                                            title={
                                                <div className="d-flex gap-4 align-items-center">
                                                    <div>Preview</div>
                                                    <div className="btn-group">
                                                        {previewModeOptions.map(mode => (
                                                            <button
                                                                key={mode.value}
                                                                type="button"
                                                                className={classnames(
                                                                    'btn btn-secondary btn-sm',
                                                                    mode.value === previewMode && 'active'
                                                                )}
                                                                onClick={() => setPreviewMode(mode.value)}
                                                            >
                                                                {mode.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            }
                                            hasForm={false}
                                            dialogClassName={currentPreviewMode.dialogClassName}
                                            renderTrigger={({ show }) => (
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary float-end"
                                                    onClick={show}
                                                >
                                                    Preview
                                                </button>
                                            )}
                                            renderBody={({ hide }) => (
                                                <div
                                                    className={style.preview}
                                                    dangerouslySetInnerHTML={{ __html: getHtml(values.body) }}
                                                />
                                            )}
                                        />
                                        <Field
                                            name="body"
                                            label="Content"
                                            description={
                                                <div>
                                                    Use{' '}
                                                    <a
                                                        href="https://www.markdownguide.org/cheat-sheet/"
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Markdown
                                                    </a>{' '}
                                                    to format the text
                                                </div>
                                            }
                                            component={Textarea}
                                        />
                                    </div>
                                    <Button
                                        className="btn btn-primary me-2"
                                        disabled={emails.length === 0 && !values.additionalRecipients}
                                    >
                                        Send message
                                    </Button>
                                </>
                            )}
                            <Button type="button" disabled={emails.length === 0} onClick={() => copyEmails(values)}>
                                Copy emails - {emails.length}
                            </Button>
                        </Form>
                    );
                }}
            </Formik>
        </Card>
    );
};

export default Email;
