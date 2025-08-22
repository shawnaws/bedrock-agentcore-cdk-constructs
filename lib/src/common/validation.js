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
    static validateTarballImageFilePath(file) {
        const validator = new (class extends BaseValidator {
            validate(config) {
                this.reset();
                if (!this.validateRequired(config, 'image file path')) {
                    return this.createResult();
                }
                // Basic path validation
                if (config.includes('..')) {
                    this.addWarning('Image file path contains ".." which may cause issues', 'Consider using an absolute path or a relative path without ".."');
                }
                // Check if the path points to a file that exists
                if (!config.endsWith('.tar')) {
                    this.addWarning('Image file path does not point to a .tar', 'Ensure the image file path points to a valid Tar image file');
                }
                return this.createResult();
            }
        })();
        return validator.validate(file);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vdmFsaWRhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQUVILDZDQUFpRjtBQUdqRjs7R0FFRztBQUNILE1BQXNCLGFBQWE7SUFBbkM7UUFDWSxXQUFNLEdBQWEsRUFBRSxDQUFDO1FBQ3RCLGFBQVEsR0FBYSxFQUFFLENBQUM7UUFDeEIsZ0JBQVcsR0FBYSxFQUFFLENBQUM7SUFrSHZDLENBQUM7SUE5R0M7O09BRUc7SUFDTyxLQUFLO1FBQ2IsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDakIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVEOztPQUVHO0lBQ08sUUFBUSxDQUFDLE9BQWUsRUFBRSxVQUFtQjtRQUNyRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxQixJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEMsQ0FBQztJQUNILENBQUM7SUFFRDs7T0FFRztJQUNPLFVBQVUsQ0FBQyxPQUFlLEVBQUUsVUFBbUI7UUFDdkQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUIsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNmLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDTyxZQUFZO1FBQ3BCLE9BQU87WUFDTCxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQztZQUNqQyxNQUFNLEVBQUUsQ0FBQyxHQUFH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Q25FLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsTUFBTSxJQUFJLDJCQUFjLENBQ3RCLGFBQWEsRUFDYixZQUFZLEVBQ1osb0NBQW9DLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQzlELE1BQU0sQ0FBQyxXQUFXLENBQ25CLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBeE9ELDBDQXdPQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29uZmlndXJhdGlvbiB2YWxpZGF0aW9uIHV0aWxpdGllcyBmb3IgQ0RLIGNvbnN0cnVjdHNcbiAqL1xuXG5pbXBvcnQgeyBWYWxpZGF0aW9uUmVzdWx0LCBDb25maWdWYWxpZGF0b3IsIENvbnN0cnVjdEVycm9yIH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcblxuLyoqXG4gKiBCYXNlIHZhbGlkYXRvciBjbGFzcyB0aGF0IHByb3ZpZGVzIGNvbW1vbiB2YWxpZGF0aW9uIHV0aWxpdGllc1xuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZVZhbGlkYXRvcjxUPiBpbXBsZW1lbnRzIENvbmZpZ1ZhbGlkYXRvcjxUPiB7XG4gIHByb3RlY3RlZCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gIHByb3RlY3RlZCB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcbiAgcHJvdGVjdGVkIHN1Z2dlc3Rpb25zOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGFic3RyYWN0IHZhbGlkYXRlKGNvbmZpZzogVCk6IFZhbGlkYXRpb25SZXN1bHQ7XG5cbiAgLyoqXG4gICAqIFJlc2V0IHZhbGlkYXRpb24gc3RhdGVcbiAgICovXG4gIHByb3RlY3RlZCByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLmVycm9ycyA9IFtdO1xuICAgIHRoaXMud2FybmluZ3MgPSBbXTtcbiAgICB0aGlzLnN1Z2dlc3Rpb25zID0gW107XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgdmFsaWRhdGlvbiBlcnJvclxuICAgKi9cbiAgcHJvdGVjdGVkIGFkZEVycm9yKG1lc3NhZ2U6IHN0cmluZywgc3VnZ2VzdGlvbj86IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZXJyb3JzLnB1c2gobWVzc2FnZSk7XG4gICAgaWYgKHN1Z2dlc3Rpb24pIHtcbiAgICAgIHRoaXMuc3VnZ2VzdGlvbnMucHVzaChzdWdnZXN0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgdmFsaWRhdGlvbiB3YXJuaW5nXG4gICAqL1xuICBwcm90ZWN0ZWQgYWRkV2FybmluZyhtZXNzYWdlOiBzdHJpbmcsIHN1Z2dlc3Rpb24/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLndhcm5pbmdzLnB1c2gobWVzc2FnZSk7XG4gICAgaWYgKHN1Z2dlc3Rpb24pIHtcbiAgICAgIHRoaXMuc3VnZ2VzdGlvbnMucHVzaChzdWdnZXN0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIHZhbGlkYXRpb24gcmVzdWx0XG4gICAqL1xuICBwcm90ZWN0ZWQgY3JlYXRlUmVzdWx0KCk6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgIHJldHVybiB7XG4gICAgICBpc1ZhbGlkOiB0aGlzLmVycm9ycy5sZW5ndGggPT09IDAsXG4gICAgICBlcnJvcnM6IFsuLi50aGlzLmVycm9yc10sXG4gICAgICB3YXJuaW5nczogWy4uLnRoaXMud2FybmluZ3NdLFxuICAgICAgc3VnZ2VzdGlvbnM6IHRoaXMuc3VnZ2VzdGlvbnMubGVuZ3RoID4gMCA/IFsuLi50aGlzLnN1Z2dlc3Rpb25zXSA6IHVuZGVmaW5lZCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoYXQgYSByZXF1aXJlZCBmaWVsZCBpcyBwcmVzZW50XG4gICAqL1xuICBwcm90ZWN0ZWQgdmFsaWRhdGVSZXF1aXJlZCh2YWx1ZTogYW55LCBmaWVsZE5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJykge1xuICAgICAgdGhpcy5hZGRFcnJvcihcbiAgICAgICAgYCR7ZmllbGROYW1lfSBpcyByZXF1aXJlZGAsXG4gICAgICAgIGBQbGVhc2UgcHJvdmlkZSBhIHZhbHVlIGZvciAke2ZpZWxkTmFtZX1gXG4gICAgICApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGF0IGEgc3RyaW5nIG1hdGNoZXMgYSBwYXR0ZXJuXG4gICAqL1xuICBwcm90ZWN0ZWQgdmFsaWRhdGVQYXR0ZXJuKHZhbHVlOiBzdHJpbmcsIHBhdHRlcm46IFJlZ0V4cCwgZmllbGROYW1lOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoIXBhdHRlcm4udGVzdCh2YWx1ZSkpIHtcbiAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgIGAke2ZpZWxkTmFtZX0gZG9lcyBub3QgbWF0Y2ggcmVxdWlyZWQgcGF0dGVybjogJHtkZXNjcmlwdGlvbn1gLFxuICAgICAgICBgUGxlYXNlIGVuc3VyZSAke2ZpZWxkTmFtZX0gZm9sbG93cyB0aGUgZm9ybWF0OiAke2Rlc2NyaXB0aW9ufWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoYXQgYSBudW1iZXIgaXMgd2l0aGluIGEgcmFuZ2VcbiAgICovXG4gIHByb3RlY3RlZCB2YWxpZGF0ZVJhbmdlKHZhbHVlOiBudW1iZXIsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciwgZmllbGROYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAodmFsdWUgPCBtaW4gfHwgdmFsdWUgPiBtYXgpIHtcbiAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgIGAke2ZpZWxkTmFtZX0gbXVzdCBiZSBiZXR3ZWVuICR7bWlufSBhbmQgJHttYXh9LCBnb3QgJHt2YWx1ZX1gLFxuICAgICAgICBgUGxlYXNlIHNldCAke2ZpZWxkTmFtZX0gdG8gYSB2YWx1ZSBiZXR3ZWVuICR7bWlufSBhbmQgJHttYXh9YFxuICAgICAgKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgdGhhdCBhbiBhcnJheSBpcyBub3QgZW1wdHlcbiAgICovXG4gIHByb3RlY3RlZCB2YWxpZGF0ZU5vbkVtcHR5QXJyYXkodmFsdWU6IGFueVtdLCBmaWVsZE5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgdmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICBgJHtmaWVsZE5hbWV9IG11c3QgYmUgYSBub24tZW1wdHkgYXJyYXlgLFxuICAgICAgICBgUGxlYXNlIHByb3ZpZGUgYXQgbGVhc3Qgb25lIGl0ZW0gaW4gJHtmaWVsZE5hbWV9YFxuICAgICAgKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgdGhhdCBhIHZhbHVlIGlzIG9uZSBvZiB0aGUgYWxsb3dlZCBvcHRpb25zXG4gICAqL1xuICBwcm90ZWN0ZWQgdmFsaWRhdGVFbnVtPFQ+KHZhbHVlOiBULCBhbGxvd2VkVmFsdWVzOiBUW10sIGZpZWxkTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCFhbGxvd2VkVmFsdWVzLmluY2x1ZGVzKHZhbHVlKSkge1xuICAgICAgdGhpcy5hZGRFcnJvcihcbiAgICAgICAgYCR7ZmllbGROYW1lfSBtdXN0IGJlIG9uZSBvZjogJHthbGxvd2VkVmFsdWVzLmpvaW4oJywgJyl9LCBnb3QgJHt2YWx1ZX1gLFxuICAgICAgICBgUGxlYXNlIHNldCAke2ZpZWxkTmFtZX0gdG8gb25lIG9mIHRoZSBhbGxvd2VkIHZhbHVlczogJHthbGxvd2VkVmFsdWVzLmpvaW4oJywgJyl9YFxuICAgICAgKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuLyoqXG4gKiBVdGlsaXR5IGZ1bmN0aW9ucyBmb3IgY29tbW9uIHZhbGlkYXRpb24gc2NlbmFyaW9zXG4gKi9cbmV4cG9ydCBjbGFzcyBWYWxpZGF0aW9uVXRpbHMge1xuICAvKipcbiAgICogVmFsaWRhdGUgQVdTIHJlc291cmNlIG5hbWUgKGFscGhhbnVtZXJpYywgaHlwaGVucywgdW5kZXJzY29yZXMpXG4gICAqL1xuICBzdGF0aWMgdmFsaWRhdGVBd3NSZXNvdXJjZU5hbWUobmFtZTogc3RyaW5nLCBmaWVsZE5hbWU6IHN0cmluZyA9ICduYW1lJyk6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgIGNvbnN0IHZhbGlkYXRvciA9IG5ldyAoY2xhc3MgZXh0ZW5kcyBCYXNlVmFsaWRhdG9yPHN0cmluZz4ge1xuICAgICAgdmFsaWRhdGUoY29uZmlnOiBzdHJpbmcpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLnZhbGlkYXRlUmVxdWlyZWQoY29uZmlnLCBmaWVsZE5hbWUpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlUmVzdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBV1MgcmVzb3VyY2UgbmFtZXMgdHlwaWNhbGx5IGFsbG93IGFscGhhbnVtZXJpYywgaHlwaGVucywgYW5kIHVuZGVyc2NvcmVzXG4gICAgICAgIGNvbnN0IG5hbWVQYXR0ZXJuID0gL15bYS16QS1aMC05Xy1dKyQvO1xuICAgICAgICB0aGlzLnZhbGlkYXRlUGF0dGVybihjb25maWcsIG5hbWVQYXR0ZXJuLCBmaWVsZE5hbWUsICdhbHBoYW51bWVyaWMgY2hhcmFjdGVycywgaHlwaGVucywgYW5kIHVuZGVyc2NvcmVzIG9ubHknKTtcblxuICAgICAgICAvLyBDaGVjayBsZW5ndGggY29uc3RyYWludHMgKGNvbW1vbiBBV1MgbGltaXQpXG4gICAgICAgIGlmIChjb25maWcubGVuZ3RoID4gNjMpIHtcbiAgICAgICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICAgICAgYCR7ZmllbGROYW1lfSBtdXN0IGJlIDYzIGNoYXJhY3RlcnMgb3IgbGVzcywgZ290ICR7Y29uZmlnLmxlbmd0aH1gLFxuICAgICAgICAgICAgYFBsZWFzZSBzaG9ydGVuIHRoZSAke2ZpZWxkTmFtZX0gdG8gNjMgY2hhcmFjdGVycyBvciBsZXNzYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29uZmlnLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICAgICAgYCR7ZmllbGROYW1lfSBtdXN0IGJlIGF0IGxlYXN0IDEgY2hhcmFjdGVyIGxvbmdgLFxuICAgICAgICAgICAgYFBsZWFzZSBwcm92aWRlIGEgJHtmaWVsZE5hbWV9IHdpdGggYXQgbGVhc3QgMSBjaGFyYWN0ZXJgXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVJlc3VsdCgpO1xuICAgICAgfVxuICAgIH0pKCk7XG5cbiAgICByZXR1cm4gdmFsaWRhdG9yLnZhbGlkYXRlKG5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIFMzIGJ1Y2tldCBuYW1lXG4gICAqL1xuICBzdGF0aWMgdmFsaWRhdGVTM0J1Y2tldE5hbWUoYnVja2V0TmFtZTogc3RyaW5nKTogVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgY29uc3QgdmFsaWRhdG9yID0gbmV3IChjbGFzcyBleHRlbmRzIEJhc2VWYWxpZGF0b3I8c3RyaW5nPiB7XG4gICAgICB2YWxpZGF0ZShjb25maWc6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMudmFsaWRhdGVSZXF1aXJlZChjb25maWcsICdidWNrZXQgbmFtZScpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlUmVzdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTMyBidWNrZXQgbmFtaW5nIHJ1bGVzXG4gICAgICAgIGNvbnN0IGJ1Y2tldE5hbWVQYXR0ZXJuID0gL15bYS16MC05Li1dKyQvO1xuICAgICAgICBpZiAoIXRoaXMudmFsaWRhdGVQYXR0ZXJuKGNvbmZpZywgYnVja2V0TmFtZVBhdHRlcm4sICdidWNrZXQgbmFtZScsICdsb3dlcmNhc2UgbGV0dGVycywgbnVtYmVycywgZG90cywgYW5kIGh5cGhlbnMgb25seScpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlUmVzdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGRpdGlvbmFsIFMzIGJ1Y2tldCBuYW1lIHJ1bGVzXG4gICAgICAgIGlmIChjb25maWcubGVuZ3RoIDwgMyB8fCBjb25maWcubGVuZ3RoID4gNjMpIHtcbiAgICAgICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICAgICAgJ1MzIGJ1Y2tldCBuYW1lIG11c3QgYmUgYmV0d2VlbiAzIGFuZCA2MyBjaGFyYWN0ZXJzIGxvbmcnLFxuICAgICAgICAgICAgJ1BsZWFzZSBhZGp1c3QgdGhlIGJ1Y2tldCBuYW1lIGxlbmd0aCB0byBiZSBiZXR3ZWVuIDMgYW5kIDYzIGNoYXJhY3RlcnMnXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25maWcuc3RhcnRzV2l0aCgnLicpIHx8IGNvbmZpZy5lbmRzV2l0aCgnLicpKSB7XG4gICAgICAgICAgdGhpcy5hZGRFcnJvcihcbiAgICAgICAgICAgICdTMyBidWNrZXQgbmFtZSBjYW5ub3Qgc3RhcnQgb3IgZW5kIHdpdGggYSBkb3QnLFxuICAgICAgICAgICAgJ1BsZWFzZSByZW1vdmUgZG90cyBmcm9tIHRoZSBiZWdpbm5pbmcgb3IgZW5kIG9mIHRoZSBidWNrZXQgbmFtZSdcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmZpZy5pbmNsdWRlcygnLi4nKSkge1xuICAgICAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgICAgICAnUzMgYnVja2V0IG5hbWUgY2Fubm90IGNvbnRhaW4gY29uc2VjdXRpdmUgZG90cycsXG4gICAgICAgICAgICAnUGxlYXNlIHJlbW92ZSBjb25zZWN1dGl2ZSBkb3RzIGZyb20gdGhlIGJ1Y2tldCBuYW1lJ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVSZXN1bHQoKTtcbiAgICAgIH1cbiAgICB9KSgpO1xuXG4gICAgcmV0dXJuIHZhbGlkYXRvci52YWxpZGF0ZShidWNrZXROYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBTMyBwcmVmaXggKGtleSBwcmVmaXgpXG4gICAqL1xuICBzdGF0aWMgdmFsaWRhdGVTM1ByZWZpeChwcmVmaXg6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgIGNvbnN0IHZhbGlkYXRvciA9IG5ldyAoY2xhc3MgZXh0ZW5kcyBCYXNlVmFsaWRhdG9yPHN0cmluZz4ge1xuICAgICAgdmFsaWRhdGUoY29uZmlnOiBzdHJpbmcpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICBcbiAgICAgICAgLy8gUzMgcHJlZml4IGNhbiBiZSBlbXB0eSwgc28gd2UgZG9uJ3QgcmVxdWlyZSBpdFxuICAgICAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQgfHwgY29uZmlnID09PSBudWxsIHx8IGNvbmZpZyA9PT0gJycpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVSZXN1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFMzIGtleSBuYW1pbmcgcnVsZXMgYXJlIG1vcmUgcGVybWlzc2l2ZSB0aGFuIGJ1Y2tldCBuYW1lc1xuICAgICAgICBpZiAoY29uZmlnLmxlbmd0aCA+IDEwMjQpIHtcbiAgICAgICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICAgICAgJ1MzIHByZWZpeCBtdXN0IGJlIDEwMjQgY2hhcmFjdGVycyBvciBsZXNzJyxcbiAgICAgICAgICAgICdQbGVhc2Ugc2hvcnRlbiB0aGUgUzMgcHJlZml4IHRvIDEwMjQgY2hhcmFjdGVycyBvciBsZXNzJ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXYXJuIGFib3V0IHRyYWlsaW5nIHNsYXNoXG4gICAgICAgIGlmICghY29uZmlnLmVuZHNXaXRoKCcvJykgJiYgY29uZmlnLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB0aGlzLmFkZFdhcm5pbmcoXG4gICAgICAgICAgICAnUzMgcHJlZml4IHNob3VsZCB0eXBpY2FsbHkgZW5kIHdpdGggYSBmb3J3YXJkIHNsYXNoICgvKScsXG4gICAgICAgICAgICAnQ29uc2lkZXIgYWRkaW5nIGEgdHJhaWxpbmcgc2xhc2ggdG8gdGhlIFMzIHByZWZpeCBmb3IgYmV0dGVyIG9yZ2FuaXphdGlvbidcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlUmVzdWx0KCk7XG4gICAgICB9XG4gICAgfSkoKTtcblxuICAgIHJldHVybiB2YWxpZGF0b3IudmFsaWRhdGUocHJlZml4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBEb2NrZXIgcHJvamVjdCByb290IHBhdGhcbiAgICovXG4gIHN0YXRpYyB2YWxpZGF0ZURvY2tlclByb2plY3RSb290KHBhdGg6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgIGNvbnN0IHZhbGlkYXRvciA9IG5ldyAoY2xhc3MgZXh0ZW5kcyBCYXNlVmFsaWRhdG9yPHN0cmluZz4ge1xuICAgICAgdmFsaWRhdGUoY29uZmlnOiBzdHJpbmcpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLnZhbGlkYXRlUmVxdWlyZWQoY29uZmlnLCAncHJvamVjdCByb290IHBhdGgnKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVJlc3VsdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQmFzaWMgcGF0aCB2YWxpZGF0aW9uXG4gICAgICAgIGlmIChjb25maWcuaW5jbHVkZXMoJy4uJykpIHtcbiAgICAgICAgICB0aGlzLmFkZFdhcm5pbmcoXG4gICAgICAgICAgICAnUHJvamVjdCByb290IHBhdGggY29udGFpbnMgXCIuLlwiIHdoaWNoIG1heSBjYXVzZSBpc3N1ZXMnLFxuICAgICAgICAgICAgJ0NvbnNpZGVyIHVzaW5nIGFuIGFic29sdXRlIHBhdGggb3IgYSByZWxhdGl2ZSBwYXRoIHdpdGhvdXQgXCIuLlwiJ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBmb3IgY29tbW9uIERvY2tlciBmaWxlc1xuICAgICAgICBpZiAoIWNvbmZpZy5pbmNsdWRlcygnRG9ja2VyZmlsZScpICYmICFjb25maWcuZW5kc1dpdGgoJy8nKSkge1xuICAgICAgICAgIHRoaXMuYWRkV2FybmluZyhcbiAgICAgICAgICAgICdQcm9qZWN0IHJvb3Qgc2hvdWxkIGNvbnRhaW4gYSBEb2NrZXJmaWxlIG9yIGVuZCB3aXRoIFwiL1wiJyxcbiAgICAgICAgICAgICdFbnN1cmUgdGhlIHByb2plY3Qgcm9vdCBjb250YWlucyB0aGUgbmVjZXNzYXJ5IERvY2tlciBidWlsZCBmaWxlcydcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlUmVzdWx0KCk7XG4gICAgICB9XG4gICAgfSkoKTtcblxuICAgIHJldHVybiB2YWxpZGF0b3IudmFsaWRhdGUocGF0aCk7XG4gIH1cblxuICBzdGF0aWMgdmFsaWRhdGVUYXJiYWxsSW1hZ2VGaWxlUGF0aChmaWxlOiBzdHJpbmcpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICBjb25zdCB2YWxpZGF0b3IgPSBuZXcgKGNsYXNzIGV4dGVuZHMgQmFzZVZhbGlkYXRvcjxzdHJpbmc+IHtcbiAgICAgIHZhbGlkYXRlKGNvbmZpZzogc3RyaW5nKTogVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgICAgIHRoaXMucmVzZXQoKTtcblxuICAgICAgICBpZiAoIXRoaXMudmFsaWRhdGVSZXF1aXJlZChjb25maWcsICdpbWFnZSBmaWxlIHBhdGgnKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVJlc3VsdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQmFzaWMgcGF0aCB2YWxpZGF0aW9uXG4gICAgICAgIGlmIChjb25maWcuaW5jbHVkZXMoJy4uJykpIHtcbiAgICAgICAgICB0aGlzLmFkZFdhcm5pbmcoXG4gICAgICAgICAgICAnSW1hZ2UgZmlsZSBwYXRoIGNvbnRhaW5zIFwiLi5cIiB3aGljaCBtYXkgY2F1c2UgaXNzdWVzJyxcbiAgICAgICAgICAgICdDb25zaWRlciB1c2luZyBhbiBhYnNvbHV0ZSBwYXRoIG9yIGEgcmVsYXRpdmUgcGF0aCB3aXRob3V0IFwiLi5cIidcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHBhdGggcG9pbnRzIHRvIGEgZmlsZSB0aGF0IGV4aXN0c1xuICAgICAgICBpZiAoIWNvbmZpZy5lbmRzV2l0aCgnLnRhcicpKSB7XG4gICAgICAgICAgdGhpcy5hZGRXYXJuaW5nKFxuICAgICAgICAgICAgJ0ltYWdlIGZpbGUgcGF0aCBkb2VzIG5vdCBwb2ludCB0byBhIC50YXInLFxuICAgICAgICAgICAgJ0Vuc3VyZSB0aGUgaW1hZ2UgZmlsZSBwYXRoIHBvaW50cyB0byBhIHZhbGlkIFRhciBpbWFnZSBmaWxlJ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVSZXN1bHQoKTtcbiAgICAgIH1cbiAgICB9KSgpO1xuXG4gICAgcmV0dXJuIHZhbGlkYXRvci52YWxpZGF0ZShmaWxlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21iaW5lIG11bHRpcGxlIHZhbGlkYXRpb24gcmVzdWx0c1xuICAgKi9cbiAgc3RhdGljIGNvbWJpbmVWYWxpZGF0aW9uUmVzdWx0cyhyZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10pOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICBjb25zdCBjb21iaW5lZDogVmFsaWRhdGlvblJlc3VsdCA9IHtcbiAgICAgIGlzVmFsaWQ6IHRydWUsXG4gICAgICBlcnJvcnM6IFtdLFxuICAgICAgd2FybmluZ3M6IFtdLFxuICAgICAgc3VnZ2VzdGlvbnM6IFtdLFxuICAgIH07XG5cbiAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICBpZiAoIXJlc3VsdC5pc1ZhbGlkKSB7XG4gICAgICAgIGNvbWJpbmVkLmlzVmFsaWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNvbWJpbmVkLmVycm9ycy5wdXNoKC4uLnJlc3VsdC5lcnJvcnMpO1xuICAgICAgY29tYmluZWQud2FybmluZ3MucHVzaCguLi5yZXN1bHQud2FybmluZ3MpO1xuICAgICAgaWYgKHJlc3VsdC5zdWdnZXN0aW9ucykge1xuICAgICAgICBjb21iaW5lZC5zdWdnZXN0aW9ucyEucHVzaCguLi5yZXN1bHQuc3VnZ2VzdGlvbnMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlbW92ZSBzdWdnZXN0aW9ucyBpZiBlbXB0eVxuICAgIGlmIChjb21iaW5lZC5zdWdnZXN0aW9ucyEubGVuZ3RoID09PSAwKSB7XG4gICAgICBkZWxldGUgY29tYmluZWQuc3VnZ2VzdGlvbnM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbWJpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFRocm93IGEgQ29uc3RydWN0RXJyb3IgaWYgdmFsaWRhdGlvbiBmYWlsc1xuICAgKi9cbiAgc3RhdGljIHRocm93SWZJbnZhbGlkKHJlc3VsdDogVmFsaWRhdGlvblJlc3VsdCwgY29uc3RydWN0TmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCFyZXN1bHQuaXNWYWxpZCkge1xuICAgICAgdGhyb3cgbmV3IENvbnN0cnVjdEVycm9yKFxuICAgICAgICBjb25zdHJ1Y3ROYW1lLFxuICAgICAgICAnVkFMSURBVElPTicsXG4gICAgICAgIGBDb25maWd1cmF0aW9uIHZhbGlkYXRpb24gZmFpbGVkOiAke3Jlc3VsdC5lcnJvcnMuam9pbignLCAnKX1gLFxuICAgICAgICByZXN1bHQuc3VnZ2VzdGlvbnNcbiAgICAgICk7XG4gICAgfVxuICB9XG59Il19