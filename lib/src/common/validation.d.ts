/**
 * Configuration validation utilities for CDK constructs
 */
import { ValidationResult, ConfigValidator } from './interfaces';
/**
 * Base validator class that provides common validation utilities
 */
export declare abstract class BaseValidator<T> implements ConfigValidator<T> {
    protected errors: string[];
    protected warnings: string[];
    protected suggestions: string[];
    abstract validate(config: T): ValidationResult;
    /**
     * Reset validation state
     */
    protected reset(): void;
    /**
     * Add a validation error
     */
    protected addError(message: string, suggestion?: string): void;
    /**
     * Add a validation warning
     */
    protected addWarning(message: string, suggestion?: string): void;
    /**
     * Create validation result
     */
    protected createResult(): ValidationResult;
    /**
     * Validate that a required field is present
     */
    protected validateRequired(value: any, fieldName: string): boolean;
    /**
     * Validate that a string matches a pattern
     */
    protected validatePattern(value: string, pattern: RegExp, fieldName: string, description: string): boolean;
    /**
     * Validate that a number is within a range
     */
    protected validateRange(value: number, min: number, max: number, fieldName: string): boolean;
    /**
     * Validate that an array is not empty
     */
    protected validateNonEmptyArray(value: any[], fieldName: string): boolean;
    /**
     * Validate that a value is one of the allowed options
     */
    protected validateEnum<T>(value: T, allowedValues: T[], fieldName: string): boolean;
}
/**
 * Utility functions for common validation scenarios
 */
export declare class ValidationUtils {
    /**
     * Validate AWS resource name (alphanumeric, hyphens, underscores)
     */
    static validateAwsResourceName(name: string, fieldName?: string): ValidationResult;
    /**
     * Validate S3 bucket name
     */
    static validateS3BucketName(bucketName: string): ValidationResult;
    /**
     * Validate S3 prefix (key prefix)
     */
    static validateS3Prefix(prefix: string): ValidationResult;
    /**
     * Validate Docker project root path
     */
    static validateDockerProjectRoot(path: string): ValidationResult;
    /**
     * Combine multiple validation results
     */
    static combineValidationResults(results: ValidationResult[]): ValidationResult;
    /**
     * Throw a ConstructError if validation fails
     */
    static throwIfInvalid(result: ValidationResult, constructName: string): void;
}
//# sourceMappingURL=validation.d.ts.map