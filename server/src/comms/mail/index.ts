import handlebars from "handlebars";
import nodemailer from "nodemailer";
import path from "path";
import fs from "node:fs";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmailValidation = (email: string, token: string) => {
  let t = "/templates/validate-email.hbs";

  const emailTemplateSource = fs.readFileSync(path.join(__dirname, t), "utf8");

  const template = handlebars.compile(emailTemplateSource);
  const htmlToSend = template({ token: token });

  console.info(htmlToSend);
  sendEmail(
    email,
    "Validate your account",
    "Please validate your account",
    htmlToSend
  );
};

// async..await is not allowed in global scope, must use a wrapper
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Trackme" <trackme@gmail.com>', // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    text: text, // plain text body
    html: html, // html body
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview: %s", nodemailer.getTestMessageUrl(info));
}
