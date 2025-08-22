"use strict";
/**
 * Configuration validation utilities for CDK constructs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationUtils = exports.BaseValidator = void 0;
const interfaces_1 = require("./interfaces");
/**
 * Base validator class that provides common validation utilities
 */
class BaseValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.suggestions = [];
    }
    /**
     * Reset validation state
     */
    reset() {
        this.errors = [];
        this.warnings = [];
        this.suggestions = [];
    }
    /**
     * Add a validation error
     */
    addError(message, suggestion) {
        this.errors.push(message);
        if (suggestion) {
            this.suggestions.push(suggestion);
        }
    }
    /**
     * Add a validation warning
     */
    addWarning(message, suggestion) {
        this.warnings.push(message);
        if (suggestion) {
            this.suggestions.push(suggestion);
        }
    }
    /**
     * Create validation result
     */
    createResult() {
        return {
            isValid: this.errors.length === 0,
            errors: [...this.errors],
            warnings: [...this.warnings],
            suggestions: this.suggestions.length > 0 ? [...this.suggestions] : undefined,
        };
    }
    /**
     * Validate that a required field is present
     */
    validateRequired(value, fieldName) {
        if (value === undefined || value === null || value === '') {
            this.addError(`${fieldName} is required`, `Please provide a value for ${fieldName}`);
            return false;
        }
        return true;
    }
    /**
     * Validate that a string matches a pattern
     */
    validatePattern(value, pattern, fieldName, description) {
        if (!pattern.test(value)) {
            this.addError(`${fieldName} does not match required pattern: ${description}`, `Please ensure ${fieldName} follows the format: ${description}`);
            return false;
        }
        return true;
    }
    /**
     * Validate that a number is within a range
     */
    validateRange(value, min, max, fieldName) {
        if (value < min || value > max) {
            this.addError(`${fieldName} must be between ${min} and ${max}, got ${value}`, `Please set ${fieldName} to a value between ${min} and ${max}`);
            return false;
        }
        return true;
    }
    /**
     * Validate that an array is not empty
     */
    validateNonEmptyArray(value, fieldName) {
        if (!Array.isArray(value) || value.length === 0) {
            this.addError(`${fieldName} must be a non-empty array`, `Please provide at least one item in ${fieldName}`);
            return false;
        }
        return true;
    }
    /**
     * Validate that a value is one of the allowed options
     */
    validateEnum(value, allowedValues, fieldName) {
        if (!allowedValues.includes(value)) {
            this.addError(`${fieldName} must be one of: ${allowedValues.join(', ')}, got ${value}`, `Please set ${fieldName} to one of the allowed values: ${allowedValues.join(', ')}`);
            return false;
        }
        return true;
    }
}
exports.BaseValidator = BaseValidator;
/**
 * Utility functions for common validation scenarios
 */
class ValidationUtils {
    /**
     * Validate AWS resource name (alphanumeric, hyphens, underscores)
     */
    static validateAwsResourceName(name, fieldName = 'name') {
        const validator = new (class extends BaseValidator {
            validate(config) {
                this.reset();
                if (!this.validateRequired(config, fieldName)) {
                    return this.createResult();
                }
                // AWS resource names typically allow alphanumeric, hyphens, and underscores
                const namePattern = /^[a-zA-Z0-9_-]+$/;
                this.validatePattern(config, namePattern, fieldName, 'alphanumeric characters, hyphens, and underscores only');
                // Check length constraints (common AWS limit)
                if (config.length > 63) {
                    this.addError(`${fieldName} must be 63 characters or less, got ${config.length}`, `Please shorten the ${fieldName} to 63 characters or less`);
                }
                if (config.length < 1) {
                    this.addError(`${fieldName} must be at least 1 character long`, `Please provide a ${fieldName} with at least 1 character`);
                }
                return this.createResult();
            }
        })();
        return validator.validate(name);
    }
    /**
     * Validate S3 bucket name
     */
    static validateS3BucketName(bucketName) {
        const validator = new (class extends BaseValidator {
            validate(config) {
                this.reset();
                if (!this.validateRequired(config, 'bucket name')) {
                    return this.createResult();
                }
                // S3 bucket naming rules
                const bucketNamePattern = /^[a-z0-9.-]+$/;
                if (!this.validatePattern(config, bucketNamePattern, 'bucket name', 'lowercase letters, numbers, dots, and hyphens only')) {
                    return this.createResult();
                }
                // Additional S3 bucket name rules
                if (config.length < 3 || config.length > 63) {
                    this.addError('S3 bucket name must be between 3 and 63 characters long', 'Please adjust the bucket name length to be between 3 and 63 characters');
                }
                if (config.startsWith('.') || config.endsWith('.')) {
                    this.addError('S3 bucket name cannot start or end with a dot', 'Please remove dots from the beginning or end of the bucket name');
                }
                if (config.includes('..')) {
                    this.addError('S3 bucket name cannot contain consecutive dots', 'Please remove consecutive dots from the bucket name');
                }
                return this.createResult();
            }
        })();
        return validator.validate(bucketName);
    }
    /**
     * Validate S3 prefix (key prefix)
     */
    static validateS3Prefix(prefix) {
        const validator = new (class extends BaseValidator {
            validate(config) {
                this.reset();
                // S3 prefix can be empty, so we don't require it
                if (config === undefined || config === null || config === '') {
                    return this.createResult();
                }
                // S3 key naming rules are more permissive than bucket names
                if (config.length > 1024) {
                    this.addError('S3 prefix must be 1024 characters or less', 'Please shorten the S3 prefix to 1024 characters or less');
                }
                // Warn about trailing slash
                if (!config.endsWith('/') && config.length > 0) {
                    this.addWarning('S3 prefix should typically end with a forward slash (/)', 'Consider adding a trailing slash to the S3 prefix for better organization');
                }
                return this.createResult();
            }
        })();
        return validator.validate(prefix);
    }
    /**
     * Validate Docker project root path
     */
    static validateDockerProjectRoot(path) {
        const validator = new (class extends BaseValidator {
            validate(config) {
                this.reset();
                if (!this.validateRequired(config, 'project root path')) {
                    return this.createResult();
                }
                // Basic path validation
                if (config.includes('..')) {
                    this.addWarning('Project root path contains ".." which may cause issues', 'Consider using an absolute path or a relative path without ".."');
                }
                // Check for common Docker files
                if (!config.includes('Dockerfile') && !config.endsWith('/')) {
                    this.addWarning('Project root should contain a Dockerfile or end with "/"', 'Ensure the project root contains the necessary Docker build files');
                }
                return this.createResult();
            }
        })();
        return validator.validate(path);
    }
    /**
     * Combine multiple validation results
     */
    static combineValidationResults(results) {
        const combined = {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: [],
        };
        for (const result of results) {
            if (!result.isValid) {
                combined.isValid = false;
            }
            combined.errors.push(...result.errors);
            combined.warnings.push(...result.warnings);
            if (result.suggestions) {
                combined.suggestions.push(...result.suggestions);
            }
        }
        // Remove suggestions if empty
        if (combined.suggestions.length === 0) {
            delete combined.suggestions;
        }
        return combined;
    }
    /**
     * Throw a ConstructError if validation fails
     */
    static throwIfInvalid(result, constructName) {
        if (!result.isValid) {
            throw new interfaces_1.ConstructError(constructName, 'VALIDATION', `Configuration validation failed: ${result.errors.join(', ')}`, result.suggestions);
        }
    }
}
exports.ValidationUtils = ValidationUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tb24vdmFsaWRhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQUVILDZDQUFpRjtBQUVqRjs7R0FFRztBQUNILE1BQXNCLGFBQWE7SUFBbkM7UUFDWSxXQUFNLEdBQWEsRUFBRSxDQUFDO1FBQ3RCLGFBQVEsR0FBYSxFQUFFLENBQUM7UUFDeEIsZ0JBQVcsR0FBYSxFQUFFLENBQUM7SUFrSHZDLENBQUM7SUE5R0M7O09BRUc7SUFDTyxLQUFLO1FBQ2IsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDakIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVEOztPQUVHO0lBQ08sUUFBUSxDQUFDLE9BQWUsRUFBRSxVQUFtQjtRQUNyRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxQixJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEMsQ0FBQztJQUNILENBQUM7SUFFRDs7T0FFRztJQUNPLFVBQVUsQ0FBQyxPQUFlLEVBQUUsVUFBbUI7UUFDdkQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUIsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNmLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDTyxZQUFZO1FBQ3BCLE9BQU87WUFDTCxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQztZQUNqQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLElB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QUMsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDcEQsQ0FBQztRQUNILENBQUM7UUFFRCw4QkFBOEI7UUFDOUIsSUFBSSxRQUFRLENBQUMsV0FBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN2QyxPQUFPLFFBQVEsQ0FBQyxXQUFXLENBQUM7UUFDOUIsQ0FBQztRQUVELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFFRDs7T0FFRztJQUNILE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBd0IsRUFBRSxhQUFxQjtRQUNuRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLE1BQU0sSUFBSSwyQkFBYyxDQUN0QixhQUFhLEVBQ2IsWUFBWSxFQUNaLG9DQUFvQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUM5RCxNQUFNLENBQUMsV0FBVyxDQUNuQixDQUFDO1FBQ0osQ0FBQztJQUNILENBQUM7Q0FDRjtBQXhNRCwwQ0F3TUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvbmZpZ3VyYXRpb24gdmFsaWRhdGlvbiB1dGlsaXRpZXMgZm9yIENESyBjb25zdHJ1Y3RzXG4gKi9cblxuaW1wb3J0IHsgVmFsaWRhdGlvblJlc3VsdCwgQ29uZmlnVmFsaWRhdG9yLCBDb25zdHJ1Y3RFcnJvciB9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5cbi8qKlxuICogQmFzZSB2YWxpZGF0b3IgY2xhc3MgdGhhdCBwcm92aWRlcyBjb21tb24gdmFsaWRhdGlvbiB1dGlsaXRpZXNcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VWYWxpZGF0b3I8VD4gaW1wbGVtZW50cyBDb25maWdWYWxpZGF0b3I8VD4ge1xuICBwcm90ZWN0ZWQgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICBwcm90ZWN0ZWQgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG4gIHByb3RlY3RlZCBzdWdnZXN0aW9uczogc3RyaW5nW10gPSBbXTtcblxuICBhYnN0cmFjdCB2YWxpZGF0ZShjb25maWc6IFQpOiBWYWxpZGF0aW9uUmVzdWx0O1xuXG4gIC8qKlxuICAgKiBSZXNldCB2YWxpZGF0aW9uIHN0YXRlXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5lcnJvcnMgPSBbXTtcbiAgICB0aGlzLndhcm5pbmdzID0gW107XG4gICAgdGhpcy5zdWdnZXN0aW9ucyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIHZhbGlkYXRpb24gZXJyb3JcbiAgICovXG4gIHByb3RlY3RlZCBhZGRFcnJvcihtZXNzYWdlOiBzdHJpbmcsIHN1Z2dlc3Rpb24/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmVycm9ycy5wdXNoKG1lc3NhZ2UpO1xuICAgIGlmIChzdWdnZXN0aW9uKSB7XG4gICAgICB0aGlzLnN1Z2dlc3Rpb25zLnB1c2goc3VnZ2VzdGlvbik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIHZhbGlkYXRpb24gd2FybmluZ1xuICAgKi9cbiAgcHJvdGVjdGVkIGFkZFdhcm5pbmcobWVzc2FnZTogc3RyaW5nLCBzdWdnZXN0aW9uPzogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy53YXJuaW5ncy5wdXNoKG1lc3NhZ2UpO1xuICAgIGlmIChzdWdnZXN0aW9uKSB7XG4gICAgICB0aGlzLnN1Z2dlc3Rpb25zLnB1c2goc3VnZ2VzdGlvbik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSB2YWxpZGF0aW9uIHJlc3VsdFxuICAgKi9cbiAgcHJvdGVjdGVkIGNyZWF0ZVJlc3VsdCgpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICByZXR1cm4ge1xuICAgICAgaXNWYWxpZDogdGhpcy5lcnJvcnMubGVuZ3RoID09PSAwLFxuICAgICAgZXJyb3JzOiBbLi4udGhpcy5lcnJvcnNdLFxuICAgICAgd2FybmluZ3M6IFsuLi50aGlzLndhcm5pbmdzXSxcbiAgICAgIHN1Z2dlc3Rpb25zOiB0aGlzLnN1Z2dlc3Rpb25zLmxlbmd0aCA+IDAgPyBbLi4udGhpcy5zdWdnZXN0aW9uc10gOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGF0IGEgcmVxdWlyZWQgZmllbGQgaXMgcHJlc2VudFxuICAgKi9cbiAgcHJvdGVjdGVkIHZhbGlkYXRlUmVxdWlyZWQodmFsdWU6IGFueSwgZmllbGROYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycpIHtcbiAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgIGAke2ZpZWxkTmFtZX0gaXMgcmVxdWlyZWRgLFxuICAgICAgICBgUGxlYXNlIHByb3ZpZGUgYSB2YWx1ZSBmb3IgJHtmaWVsZE5hbWV9YFxuICAgICAgKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgdGhhdCBhIHN0cmluZyBtYXRjaGVzIGEgcGF0dGVyblxuICAgKi9cbiAgcHJvdGVjdGVkIHZhbGlkYXRlUGF0dGVybih2YWx1ZTogc3RyaW5nLCBwYXR0ZXJuOiBSZWdFeHAsIGZpZWxkTmFtZTogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCFwYXR0ZXJuLnRlc3QodmFsdWUpKSB7XG4gICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICBgJHtmaWVsZE5hbWV9IGRvZXMgbm90IG1hdGNoIHJlcXVpcmVkIHBhdHRlcm46ICR7ZGVzY3JpcHRpb259YCxcbiAgICAgICAgYFBsZWFzZSBlbnN1cmUgJHtmaWVsZE5hbWV9IGZvbGxvd3MgdGhlIGZvcm1hdDogJHtkZXNjcmlwdGlvbn1gXG4gICAgICApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGF0IGEgbnVtYmVyIGlzIHdpdGhpbiBhIHJhbmdlXG4gICAqL1xuICBwcm90ZWN0ZWQgdmFsaWRhdGVSYW5nZSh2YWx1ZTogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIsIGZpZWxkTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKHZhbHVlIDwgbWluIHx8IHZhbHVlID4gbWF4KSB7XG4gICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICBgJHtmaWVsZE5hbWV9IG11c3QgYmUgYmV0d2VlbiAke21pbn0gYW5kICR7bWF4fSwgZ290ICR7dmFsdWV9YCxcbiAgICAgICAgYFBsZWFzZSBzZXQgJHtmaWVsZE5hbWV9IHRvIGEgdmFsdWUgYmV0d2VlbiAke21pbn0gYW5kICR7bWF4fWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoYXQgYW4gYXJyYXkgaXMgbm90IGVtcHR5XG4gICAqL1xuICBwcm90ZWN0ZWQgdmFsaWRhdGVOb25FbXB0eUFycmF5KHZhbHVlOiBhbnlbXSwgZmllbGROYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpIHx8IHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5hZGRFcnJvcihcbiAgICAgICAgYCR7ZmllbGROYW1lfSBtdXN0IGJlIGEgbm9uLWVtcHR5IGFycmF5YCxcbiAgICAgICAgYFBsZWFzZSBwcm92aWRlIGF0IGxlYXN0IG9uZSBpdGVtIGluICR7ZmllbGROYW1lfWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoYXQgYSB2YWx1ZSBpcyBvbmUgb2YgdGhlIGFsbG93ZWQgb3B0aW9uc1xuICAgKi9cbiAgcHJvdGVjdGVkIHZhbGlkYXRlRW51bTxUPih2YWx1ZTogVCwgYWxsb3dlZFZhbHVlczogVFtdLCBmaWVsZE5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICghYWxsb3dlZFZhbHVlcy5pbmNsdWRlcyh2YWx1ZSkpIHtcbiAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgIGAke2ZpZWxkTmFtZX0gbXVzdCBiZSBvbmUgb2Y6ICR7YWxsb3dlZFZhbHVlcy5qb2luKCcsICcpfSwgZ290ICR7dmFsdWV9YCxcbiAgICAgICAgYFBsZWFzZSBzZXQgJHtmaWVsZE5hbWV9IHRvIG9uZSBvZiB0aGUgYWxsb3dlZCB2YWx1ZXM6ICR7YWxsb3dlZFZhbHVlcy5qb2luKCcsICcpfWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbnMgZm9yIGNvbW1vbiB2YWxpZGF0aW9uIHNjZW5hcmlvc1xuICovXG5leHBvcnQgY2xhc3MgVmFsaWRhdGlvblV0aWxzIHtcbiAgLyoqXG4gICAqIFZhbGlkYXRlIEFXUyByZXNvdXJjZSBuYW1lIChhbHBoYW51bWVyaWMsIGh5cGhlbnMsIHVuZGVyc2NvcmVzKVxuICAgKi9cbiAgc3RhdGljIHZhbGlkYXRlQXdzUmVzb3VyY2VOYW1lKG5hbWU6IHN0cmluZywgZmllbGROYW1lOiBzdHJpbmcgPSAnbmFtZScpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICBjb25zdCB2YWxpZGF0b3IgPSBuZXcgKGNsYXNzIGV4dGVuZHMgQmFzZVZhbGlkYXRvcjxzdHJpbmc+IHtcbiAgICAgIHZhbGlkYXRlKGNvbmZpZzogc3RyaW5nKTogVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy52YWxpZGF0ZVJlcXVpcmVkKGNvbmZpZywgZmllbGROYW1lKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVJlc3VsdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQVdTIHJlc291cmNlIG5hbWVzIHR5cGljYWxseSBhbGxvdyBhbHBoYW51bWVyaWMsIGh5cGhlbnMsIGFuZCB1bmRlcnNjb3Jlc1xuICAgICAgICBjb25zdCBuYW1lUGF0dGVybiA9IC9eW2EtekEtWjAtOV8tXSskLztcbiAgICAgICAgdGhpcy52YWxpZGF0ZVBhdHRlcm4oY29uZmlnLCBuYW1lUGF0dGVybiwgZmllbGROYW1lLCAnYWxwaGFudW1lcmljIGNoYXJhY3RlcnMsIGh5cGhlbnMsIGFuZCB1bmRlcnNjb3JlcyBvbmx5Jyk7XG5cbiAgICAgICAgLy8gQ2hlY2sgbGVuZ3RoIGNvbnN0cmFpbnRzIChjb21tb24gQVdTIGxpbWl0KVxuICAgICAgICBpZiAoY29uZmlnLmxlbmd0aCA+IDYzKSB7XG4gICAgICAgICAgdGhpcy5hZGRFcnJvcihcbiAgICAgICAgICAgIGAke2ZpZWxkTmFtZX0gbXVzdCBiZSA2MyBjaGFyYWN0ZXJzIG9yIGxlc3MsIGdvdCAke2NvbmZpZy5sZW5ndGh9YCxcbiAgICAgICAgICAgIGBQbGVhc2Ugc2hvcnRlbiB0aGUgJHtmaWVsZE5hbWV9IHRvIDYzIGNoYXJhY3RlcnMgb3IgbGVzc2BcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmZpZy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgdGhpcy5hZGRFcnJvcihcbiAgICAgICAgICAgIGAke2ZpZWxkTmFtZX0gbXVzdCBiZSBhdCBsZWFzdCAxIGNoYXJhY3RlciBsb25nYCxcbiAgICAgICAgICAgIGBQbGVhc2UgcHJvdmlkZSBhICR7ZmllbGROYW1lfSB3aXRoIGF0IGxlYXN0IDEgY2hhcmFjdGVyYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVSZXN1bHQoKTtcbiAgICAgIH1cbiAgICB9KSgpO1xuXG4gICAgcmV0dXJuIHZhbGlkYXRvci52YWxpZGF0ZShuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBTMyBidWNrZXQgbmFtZVxuICAgKi9cbiAgc3RhdGljIHZhbGlkYXRlUzNCdWNrZXROYW1lKGJ1Y2tldE5hbWU6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgIGNvbnN0IHZhbGlkYXRvciA9IG5ldyAoY2xhc3MgZXh0ZW5kcyBCYXNlVmFsaWRhdG9yPHN0cmluZz4ge1xuICAgICAgdmFsaWRhdGUoY29uZmlnOiBzdHJpbmcpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLnZhbGlkYXRlUmVxdWlyZWQoY29uZmlnLCAnYnVja2V0IG5hbWUnKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVJlc3VsdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUzMgYnVja2V0IG5hbWluZyBydWxlc1xuICAgICAgICBjb25zdCBidWNrZXROYW1lUGF0dGVybiA9IC9eW2EtejAtOS4tXSskLztcbiAgICAgICAgaWYgKCF0aGlzLnZhbGlkYXRlUGF0dGVybihjb25maWcsIGJ1Y2tldE5hbWVQYXR0ZXJuLCAnYnVja2V0IG5hbWUnLCAnbG93ZXJjYXNlIGxldHRlcnMsIG51bWJlcnMsIGRvdHMsIGFuZCBoeXBoZW5zIG9ubHknKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVJlc3VsdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkaXRpb25hbCBTMyBidWNrZXQgbmFtZSBydWxlc1xuICAgICAgICBpZiAoY29uZmlnLmxlbmd0aCA8IDMgfHwgY29uZmlnLmxlbmd0aCA+IDYzKSB7XG4gICAgICAgICAgdGhpcy5hZGRFcnJvcihcbiAgICAgICAgICAgICdTMyBidWNrZXQgbmFtZSBtdXN0IGJlIGJldHdlZW4gMyBhbmQgNjMgY2hhcmFjdGVycyBsb25nJyxcbiAgICAgICAgICAgICdQbGVhc2UgYWRqdXN0IHRoZSBidWNrZXQgbmFtZSBsZW5ndGggdG8gYmUgYmV0d2VlbiAzIGFuZCA2MyBjaGFyYWN0ZXJzJ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29uZmlnLnN0YXJ0c1dpdGgoJy4nKSB8fCBjb25maWcuZW5kc1dpdGgoJy4nKSkge1xuICAgICAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgICAgICAnUzMgYnVja2V0IG5hbWUgY2Fubm90IHN0YXJ0IG9yIGVuZCB3aXRoIGEgZG90JyxcbiAgICAgICAgICAgICdQbGVhc2UgcmVtb3ZlIGRvdHMgZnJvbSB0aGUgYmVnaW5uaW5nIG9yIGVuZCBvZiB0aGUgYnVja2V0IG5hbWUnXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25maWcuaW5jbHVkZXMoJy4uJykpIHtcbiAgICAgICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICAgICAgJ1MzIGJ1Y2tldCBuYW1lIGNhbm5vdCBjb250YWluIGNvbnNlY3V0aXZlIGRvdHMnLFxuICAgICAgICAgICAgJ1BsZWFzZSByZW1vdmUgY29uc2VjdXRpdmUgZG90cyBmcm9tIHRoZSBidWNrZXQgbmFtZSdcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlUmVzdWx0KCk7XG4gICAgICB9XG4gICAgfSkoKTtcblxuICAgIHJldHVybiB2YWxpZGF0b3IudmFsaWRhdGUoYnVja2V0TmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgUzMgcHJlZml4IChrZXkgcHJlZml4KVxuICAgKi9cbiAgc3RhdGljIHZhbGlkYXRlUzNQcmVmaXgocHJlZml4OiBzdHJpbmcpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICBjb25zdCB2YWxpZGF0b3IgPSBuZXcgKGNsYXNzIGV4dGVuZHMgQmFzZVZhbGlkYXRvcjxzdHJpbmc+IHtcbiAgICAgIHZhbGlkYXRlKGNvbmZpZzogc3RyaW5nKTogVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFMzIHByZWZpeCBjYW4gYmUgZW1wdHksIHNvIHdlIGRvbid0IHJlcXVpcmUgaXRcbiAgICAgICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZyA9PT0gbnVsbCB8fCBjb25maWcgPT09ICcnKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlUmVzdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTMyBrZXkgbmFtaW5nIHJ1bGVzIGFyZSBtb3JlIHBlcm1pc3NpdmUgdGhhbiBidWNrZXQgbmFtZXNcbiAgICAgICAgaWYgKGNvbmZpZy5sZW5ndGggPiAxMDI0KSB7XG4gICAgICAgICAgdGhpcy5hZGRFcnJvcihcbiAgICAgICAgICAgICdTMyBwcmVmaXggbXVzdCBiZSAxMDI0IGNoYXJhY3RlcnMgb3IgbGVzcycsXG4gICAgICAgICAgICAnUGxlYXNlIHNob3J0ZW4gdGhlIFMzIHByZWZpeCB0byAxMDI0IGNoYXJhY3RlcnMgb3IgbGVzcydcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2FybiBhYm91dCB0cmFpbGluZyBzbGFzaFxuICAgICAgICBpZiAoIWNvbmZpZy5lbmRzV2l0aCgnLycpICYmIGNvbmZpZy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdGhpcy5hZGRXYXJuaW5nKFxuICAgICAgICAgICAgJ1MzIHByZWZpeCBzaG91bGQgdHlwaWNhbGx5IGVuZCB3aXRoIGEgZm9yd2FyZCBzbGFzaCAoLyknLFxuICAgICAgICAgICAgJ0NvbnNpZGVyIGFkZGluZyBhIHRyYWlsaW5nIHNsYXNoIHRvIHRoZSBTMyBwcmVmaXggZm9yIGJldHRlciBvcmdhbml6YXRpb24nXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVJlc3VsdCgpO1xuICAgICAgfVxuICAgIH0pKCk7XG5cbiAgICByZXR1cm4gdmFsaWRhdG9yLnZhbGlkYXRlKHByZWZpeCk7XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgRG9ja2VyIHByb2plY3Qgcm9vdCBwYXRoXG4gICAqL1xuICBzdGF0aWMgdmFsaWRhdGVEb2NrZXJQcm9qZWN0Um9vdChwYXRoOiBzdHJpbmcpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICBjb25zdCB2YWxpZGF0b3IgPSBuZXcgKGNsYXNzIGV4dGVuZHMgQmFzZVZhbGlkYXRvcjxzdHJpbmc+IHtcbiAgICAgIHZhbGlkYXRlKGNvbmZpZzogc3RyaW5nKTogVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy52YWxpZGF0ZVJlcXVpcmVkKGNvbmZpZywgJ3Byb2plY3Qgcm9vdCBwYXRoJykpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVSZXN1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJhc2ljIHBhdGggdmFsaWRhdGlvblxuICAgICAgICBpZiAoY29uZmlnLmluY2x1ZGVzKCcuLicpKSB7XG4gICAgICAgICAgdGhpcy5hZGRXYXJuaW5nKFxuICAgICAgICAgICAgJ1Byb2plY3Qgcm9vdCBwYXRoIGNvbnRhaW5zIFwiLi5cIiB3aGljaCBtYXkgY2F1c2UgaXNzdWVzJyxcbiAgICAgICAgICAgICdDb25zaWRlciB1c2luZyBhbiBhYnNvbHV0ZSBwYXRoIG9yIGEgcmVsYXRpdmUgcGF0aCB3aXRob3V0IFwiLi5cIidcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIGNvbW1vbiBEb2NrZXIgZmlsZXNcbiAgICAgICAgaWYgKCFjb25maWcuaW5jbHVkZXMoJ0RvY2tlcmZpbGUnKSAmJiAhY29uZmlnLmVuZHNXaXRoKCcvJykpIHtcbiAgICAgICAgICB0aGlzLmFkZFdhcm5pbmcoXG4gICAgICAgICAgICAnUHJvamVjdCByb290IHNob3VsZCBjb250YWluIGEgRG9ja2VyZmlsZSBvciBlbmQgd2l0aCBcIi9cIicsXG4gICAgICAgICAgICAnRW5zdXJlIHRoZSBwcm9qZWN0IHJvb3QgY29udGFpbnMgdGhlIG5lY2Vzc2FyeSBEb2NrZXIgYnVpbGQgZmlsZXMnXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVJlc3VsdCgpO1xuICAgICAgfVxuICAgIH0pKCk7XG5cbiAgICByZXR1cm4gdmFsaWRhdG9yLnZhbGlkYXRlKHBhdGgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbWJpbmUgbXVsdGlwbGUgdmFsaWRhdGlvbiByZXN1bHRzXG4gICAqL1xuICBzdGF0aWMgY29tYmluZVZhbGlkYXRpb25SZXN1bHRzKHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSk6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgIGNvbnN0IGNvbWJpbmVkOiBWYWxpZGF0aW9uUmVzdWx0ID0ge1xuICAgICAgaXNWYWxpZDogdHJ1ZSxcbiAgICAgIGVycm9yczogW10sXG4gICAgICB3YXJuaW5nczogW10sXG4gICAgICBzdWdnZXN0aW9uczogW10sXG4gICAgfTtcblxuICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIHJlc3VsdHMpIHtcbiAgICAgIGlmICghcmVzdWx0LmlzVmFsaWQpIHtcbiAgICAgICAgY29tYmluZWQuaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgY29tYmluZWQuZXJyb3JzLnB1c2goLi4ucmVzdWx0LmVycm9ycyk7XG4gICAgICBjb21iaW5lZC53YXJuaW5ncy5wdXNoKC4uLnJlc3VsdC53YXJuaW5ncyk7XG4gICAgICBpZiAocmVzdWx0LnN1Z2dlc3Rpb25zKSB7XG4gICAgICAgIGNvbWJpbmVkLnN1Z2dlc3Rpb25zIS5wdXNoKC4uLnJlc3VsdC5zdWdnZXN0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIHN1Z2dlc3Rpb25zIGlmIGVtcHR5XG4gICAgaWYgKGNvbWJpbmVkLnN1Z2dlc3Rpb25zIS5sZW5ndGggPT09IDApIHtcbiAgICAgIGRlbGV0ZSBjb21iaW5lZC5zdWdnZXN0aW9ucztcbiAgICB9XG5cbiAgICByZXR1cm4gY29tYmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogVGhyb3cgYSBDb25zdHJ1Y3RFcnJvciBpZiB2YWxpZGF0aW9uIGZhaWxzXG4gICAqL1xuICBzdGF0aWMgdGhyb3dJZkludmFsaWQocmVzdWx0OiBWYWxpZGF0aW9uUmVzdWx0LCBjb25zdHJ1Y3ROYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIXJlc3VsdC5pc1ZhbGlkKSB7XG4gICAgICB0aHJvdyBuZXcgQ29uc3RydWN0RXJyb3IoXG4gICAgICAgIGNvbnN0cnVjdE5hbWUsXG4gICAgICAgICdWQUxJREFUSU9OJyxcbiAgICAgICAgYENvbmZpZ3VyYXRpb24gdmFsaWRhdGlvbiBmYWlsZWQ6ICR7cmVzdWx0LmVycm9ycy5qb2luKCcsICcpfWAsXG4gICAgICAgIHJlc3VsdC5zdWdnZXN0aW9uc1xuICAgICAgKTtcbiAgICB9XG4gIH1cbn0iXX0=