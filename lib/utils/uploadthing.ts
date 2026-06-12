"use client";

import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const UploadButton = generateUploadButton<OurFileRouter>();
const UploadDropzone = generateUploadDropzone<OurFileRouter>();

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
