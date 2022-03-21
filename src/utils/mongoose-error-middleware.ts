//@ts-nocheck
import { ServiceError } from '@dgoudie/service-error';
import mongoose from 'mongoose';

const DOCUMENT_VALIDATION_FAILED_CODE = 121;
const validationFailureMessage = 'Invalid data provided - Validation failed.';

export const handleMongooseError: mongoose.ErrorHandlingMiddlewareFunction = (
    error,
    doc,
    next
) => {
    if (!error) {
        next();
    } else {
        if (error.code === DOCUMENT_VALIDATION_FAILED_CODE) {
            next(new ServiceError(400, validationFailureMessage, error.stack));
        } else {
            next(new ServiceError(500, error.message, error.stack));
        }
    }
};
