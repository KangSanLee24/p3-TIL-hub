import nodemailer from "nodemailer";
import { MAILPASS } from "./env.constant.js";

export const transporter = nodemailer.createTransport({
  service: 'naver',
  host: 'smtp.naver.com',
  port: 465,
  auth: {
    user: 'tilhub@naver.com',
    pass: MAILPASS,
  },
});