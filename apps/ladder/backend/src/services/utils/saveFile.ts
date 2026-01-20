import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { S3_BUCKET_NAME } from '../../constants';

const fileTypes = {
    pdf: {
        contentType: 'application/pdf',
        example: 'https://utl.nyc3.digitaloceanspaces.com/pdf/2022-summer-mens-40-2022-09-16.pdf',
    },
    png: {
        contentType: 'image/png',
        example: 'https://utl.nyc3.digitaloceanspaces.com/images/raleigh-match-stats-example.png',
    },
    jpg: {
        contentType: 'image/jpeg',
        example: 'https://utl.nyc3.digitaloceanspaces.com/images/raleigh-match-stats-example.jpg',
    },
    xlsx: {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        example: 'https://utl.nyc3.digitaloceanspaces.com/images/raleigh-match-stats-example.jpg',
    },
};

const saveFile = async (filename, content) => {
    const extension = filename.slice(filename.lastIndexOf('.') + 1);
    const fileType = fileTypes[extension];
    if (!fileType) {
        throw new Error(`The extension "${extension}" is not supported`);
    }

    if (process.env.NODE_ENV === 'test') {
        return {
            src: fileType.example,
        };
    }

    if (extension === 'png') {
        content = await sharp(content).png({ quality: 75 }).toBuffer();
    } else if (extension === 'jpg') {
        content = await sharp(content).jpeg().toBuffer();
    }

    const key = `temp/${filename}`;
    const client = new S3Client();
    const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: fileType.contentType,
    });
    await client.send(command);

    return {
        src: `https://s3.${process.env.AWS_REGION}.amazonaws.com/${S3_BUCKET_NAME}/${key}`,
    };
};

export default saveFile;
