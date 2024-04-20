import handlebars from "handlebars";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Function to send email validation
export const sendEmailValidation = (email: string, token: string) => {
  // Define the path to the email template
  const templatePath = "/templates/validate-email.hbs";
  // Read the email template source from the file
  const emailTemplateSource = fs.readFileSync(
    path.join(__dirname, templatePath),
    "utf8"
  );
  // Compile the template using Handlebars
  const compiledTemplate = handlebars.compile(emailTemplateSource);
  // Generate the HTML content to be sent in the email
  const htmlContent = compiledTemplate({ token: token });
  // Send the email with the generated content
  sendEmail(
    email,
    "Validate your account",
    "Please validate your account",
    htmlContent
  );
};

// Function to send email
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  // Send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Trackme" <trackme@gmail.com>', // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    text: text, // Plain text body
    html: html, // HTML body
  });
  console.log("Message sent: %s", info.messageId);
  console.log("Preview: %s", nodemailer.getTestMessageUrl(info));
}
