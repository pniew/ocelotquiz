import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import helpers from 'common/helpers';
import nodemailerExpressHandlebars from 'nodemailer-express-handlebars';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import path from 'path';

dotenv.config();

const options: SMTPTransport.Options = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
};
const transporter = nodemailer.createTransport(options);
transporter.use('compile', nodemailerExpressHandlebars({
    viewEngine: {
        partialsDir: path.join(__dirname, '../views/partials'),
        layoutsDir: path.join(__dirname, '../views/layouts'),
        defaultLayout: 'mail',
        helpers
    },
    viewPath: path.join(__dirname, '../views')
}));

export default transporter;
