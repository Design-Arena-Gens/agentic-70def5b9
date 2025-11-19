import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import * as functions from "firebase-functions";
import { z } from "zod";

initializeApp();

const db = getFirestore();

const outboundEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(3),
  body: z.string().min(10),
});

export const sanitizeJobDescription = functions.firestore
  .document("jobs/{jobId}")
  .onWrite(async (change, context) => {
    const data = change.after.exists ? change.after.data() : null;
    if (!data) {
      return;
    }

    const sanitizedDescription = String(data.description ?? "")
      .replace(/<script.*?>.*?<\/script>/gi, "")
      .replace(/on\w+=".*?"/g, "");

    if (sanitizedDescription !== data.description) {
      await change.after.ref.update({
        description: sanitizedDescription,
        lastSanitizedAt: new Date(),
      });
      logger.info("Sanitized job description", { jobId: context.params.jobId });
    }
  });

export const sendJobPublishedNotification = functions.firestore
  .document("jobs/{jobId}")
  .onUpdate(async (change, context) => {
    const beforeStatus = change.before.get("status");
    const afterStatus = change.after.get("status");

    if (beforeStatus === "published" || afterStatus !== "published") {
      return;
    }

    const recruiterId = change.after.get("postedBy");
    if (!recruiterId) {
      return;
    }

    const recruiterDoc = await db.collection("users").doc(recruiterId).get();
    const recruiterEmail = recruiterDoc.get("email");

    if (!recruiterEmail) {
      logger.warn("No recruiter email found for job", {
        jobId: context.params.jobId,
      });
      return;
    }

    const emailPayload = outboundEmailSchema.parse({
      to: recruiterEmail,
      subject: `Job published: ${change.after.get("title")}`,
      body: `Your job "${change.after.get("title")}" is now live on WorkFlicks.in.`,
    });

    await db.collection("mailQueue").add({
      ...emailPayload,
      createdAt: new Date(),
      status: "pending",
    });

    logger.info("Queued publication email", {
      jobId: context.params.jobId,
      email: recruiterEmail,
    });
  });

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  logger.info("Received Stripe webhook", { body: req.body });
  res.status(200).send({ received: true });
});
