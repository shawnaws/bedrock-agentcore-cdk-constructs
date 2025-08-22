"use strict";
/**
 * Configuration validation utilities for CDK constructs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationUtils = exports.BaseValidator = void 0;
const interfaces_1 = require("./interfaces");
const fs_1 = __importDefault(require("fs"));
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
                if (fs_1.default.existsSync(config) === false) {
                    this.addError('Image file path does not exist', 'Ensure the image file path points to a valid Tar image file');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vdmFsaWRhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7Ozs7OztBQUVILDZDQUFpRjtBQUNqRiw0Q0FBb0I7QUFFcEI7O0dBRUc7QUFDSCxNQUFzQixhQUFhO0lBQW5DO1FBQ1ksV0FBTSxHQUFhLEVBQUUsQ0FBQztRQUN0QixhQUFRLEdBQWEsRUFBRSxDQUFDO1FBQ3hCLGdCQUFXLEdBQWEsRUFBRSxDQUFDO0lBa0h2QyxDQUFDO0lBOUdDOztPQUVHO0lBQ08sS0FBSztRQUNiLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ25CLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7T0FFRztJQUNPLFFBQVEsQ0FBQyxPQUFlLEVBQUUsVUFBbUI7UUFDckQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUIsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNmLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDTyxVQUFVLENBQUMsT0FBZSxFQUFFLFVBQW1CO1FBQ3ZELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLElBQUksVUFBVSxFQUFFLENBQUM7WUFDZixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNwQyxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ08sWUFBWTtRQUNwQixPQUFPO1lBQ0wsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUM7WUFDakMsTUFB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QUssQ0FBQyxFQUFFLENBQUM7WUFDdkMsT0FBTyxRQUFRLENBQUMsV0FBVyxDQUFDO1FBQzlCLENBQUM7UUFFRCxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQXdCLEVBQUUsYUFBcUI7UUFDbkUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQixNQUFNLElBQUksMkJBQWMsQ0FDdEIsYUFBYSxFQUNiLFlBQVksRUFDWixvQ0FBb0MsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FDbkIsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUEvT0QsMENBK09DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb25maWd1cmF0aW9uIHZhbGlkYXRpb24gdXRpbGl0aWVzIGZvciBDREsgY29uc3RydWN0c1xuICovXG5cbmltcG9ydCB7IFZhbGlkYXRpb25SZXN1bHQsIENvbmZpZ1ZhbGlkYXRvciwgQ29uc3RydWN0RXJyb3IgfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuXG4vKipcbiAqIEJhc2UgdmFsaWRhdG9yIGNsYXNzIHRoYXQgcHJvdmlkZXMgY29tbW9uIHZhbGlkYXRpb24gdXRpbGl0aWVzXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlVmFsaWRhdG9yPFQ+IGltcGxlbWVudHMgQ29uZmlnVmFsaWRhdG9yPFQ+IHtcbiAgcHJvdGVjdGVkIGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgcHJvdGVjdGVkIHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xuICBwcm90ZWN0ZWQgc3VnZ2VzdGlvbnM6IHN0cmluZ1tdID0gW107XG5cbiAgYWJzdHJhY3QgdmFsaWRhdGUoY29uZmlnOiBUKTogVmFsaWRhdGlvblJlc3VsdDtcblxuICAvKipcbiAgICogUmVzZXQgdmFsaWRhdGlvbiBzdGF0ZVxuICAgKi9cbiAgcHJvdGVjdGVkIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuZXJyb3JzID0gW107XG4gICAgdGhpcy53YXJuaW5ncyA9IFtdO1xuICAgIHRoaXMuc3VnZ2VzdGlvbnMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSB2YWxpZGF0aW9uIGVycm9yXG4gICAqL1xuICBwcm90ZWN0ZWQgYWRkRXJyb3IobWVzc2FnZTogc3RyaW5nLCBzdWdnZXN0aW9uPzogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5lcnJvcnMucHVzaChtZXNzYWdlKTtcbiAgICBpZiAoc3VnZ2VzdGlvbikge1xuICAgICAgdGhpcy5zdWdnZXN0aW9ucy5wdXNoKHN1Z2dlc3Rpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSB2YWxpZGF0aW9uIHdhcm5pbmdcbiAgICovXG4gIHByb3RlY3RlZCBhZGRXYXJuaW5nKG1lc3NhZ2U6IHN0cmluZywgc3VnZ2VzdGlvbj86IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMud2FybmluZ3MucHVzaChtZXNzYWdlKTtcbiAgICBpZiAoc3VnZ2VzdGlvbikge1xuICAgICAgdGhpcy5zdWdnZXN0aW9ucy5wdXNoKHN1Z2dlc3Rpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgdmFsaWRhdGlvbiByZXN1bHRcbiAgICovXG4gIHByb3RlY3RlZCBjcmVhdGVSZXN1bHQoKTogVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlzVmFsaWQ6IHRoaXMuZXJyb3JzLmxlbmd0aCA9PT0gMCxcbiAgICAgIGVycm9yczogWy4uLnRoaXMuZXJyb3JzXSxcbiAgICAgIHdhcm5pbmdzOiBbLi4udGhpcy53YXJuaW5nc10sXG4gICAgICBzdWdnZXN0aW9uczogdGhpcy5zdWdnZXN0aW9ucy5sZW5ndGggPiAwID8gWy4uLnRoaXMuc3VnZ2VzdGlvbnNdIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgdGhhdCBhIHJlcXVpcmVkIGZpZWxkIGlzIHByZXNlbnRcbiAgICovXG4gIHByb3RlY3RlZCB2YWxpZGF0ZVJlcXVpcmVkKHZhbHVlOiBhbnksIGZpZWxkTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnKSB7XG4gICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICBgJHtmaWVsZE5hbWV9IGlzIHJlcXVpcmVkYCxcbiAgICAgICAgYFBsZWFzZSBwcm92aWRlIGEgdmFsdWUgZm9yICR7ZmllbGROYW1lfWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoYXQgYSBzdHJpbmcgbWF0Y2hlcyBhIHBhdHRlcm5cbiAgICovXG4gIHByb3RlY3RlZCB2YWxpZGF0ZVBhdHRlcm4odmFsdWU6IHN0cmluZywgcGF0dGVybjogUmVnRXhwLCBmaWVsZE5hbWU6IHN0cmluZywgZGVzY3JpcHRpb246IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICghcGF0dGVybi50ZXN0KHZhbHVlKSkge1xuICAgICAgdGhpcy5hZGRFcnJvcihcbiAgICAgICAgYCR7ZmllbGROYW1lfSBkb2VzIG5vdCBtYXRjaCByZXF1aXJlZCBwYXR0ZXJuOiAke2Rlc2NyaXB0aW9ufWAsXG4gICAgICAgIGBQbGVhc2UgZW5zdXJlICR7ZmllbGROYW1lfSBmb2xsb3dzIHRoZSBmb3JtYXQ6ICR7ZGVzY3JpcHRpb259YFxuICAgICAgKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgdGhhdCBhIG51bWJlciBpcyB3aXRoaW4gYSByYW5nZVxuICAgKi9cbiAgcHJvdGVjdGVkIHZhbGlkYXRlUmFuZ2UodmFsdWU6IG51bWJlciwgbWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBmaWVsZE5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICh2YWx1ZSA8IG1pbiB8fCB2YWx1ZSA+IG1heCkge1xuICAgICAgdGhpcy5hZGRFcnJvcihcbiAgICAgICAgYCR7ZmllbGROYW1lfSBtdXN0IGJlIGJldHdlZW4gJHttaW59IGFuZCAke21heH0sIGdvdCAke3ZhbHVlfWAsXG4gICAgICAgIGBQbGVhc2Ugc2V0ICR7ZmllbGROYW1lfSB0byBhIHZhbHVlIGJldHdlZW4gJHttaW59IGFuZCAke21heH1gXG4gICAgICApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGF0IGFuIGFycmF5IGlzIG5vdCBlbXB0eVxuICAgKi9cbiAgcHJvdGVjdGVkIHZhbGlkYXRlTm9uRW1wdHlBcnJheSh2YWx1ZTogYW55W10sIGZpZWxkTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSB8fCB2YWx1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgIGAke2ZpZWxkTmFtZX0gbXVzdCBiZSBhIG5vbi1lbXB0eSBhcnJheWAsXG4gICAgICAgIGBQbGVhc2UgcHJvdmlkZSBhdCBsZWFzdCBvbmUgaXRlbSBpbiAke2ZpZWxkTmFtZX1gXG4gICAgICApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGF0IGEgdmFsdWUgaXMgb25lIG9mIHRoZSBhbGxvd2VkIG9wdGlvbnNcbiAgICovXG4gIHByb3RlY3RlZCB2YWxpZGF0ZUVudW08VD4odmFsdWU6IFQsIGFsbG93ZWRWYWx1ZXM6IFRbXSwgZmllbGROYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoIWFsbG93ZWRWYWx1ZXMuaW5jbHVkZXModmFsdWUpKSB7XG4gICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICBgJHtmaWVsZE5hbWV9IG11c3QgYmUgb25lIG9mOiAke2FsbG93ZWRWYWx1ZXMuam9pbignLCAnKX0sIGdvdCAke3ZhbHVlfWAsXG4gICAgICAgIGBQbGVhc2Ugc2V0ICR7ZmllbGROYW1lfSB0byBvbmUgb2YgdGhlIGFsbG93ZWQgdmFsdWVzOiAke2FsbG93ZWRWYWx1ZXMuam9pbignLCAnKX1gXG4gICAgICApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG4vKipcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIGZvciBjb21tb24gdmFsaWRhdGlvbiBzY2VuYXJpb3NcbiAqL1xuZXhwb3J0IGNsYXNzIFZhbGlkYXRpb25VdGlscyB7XG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBBV1MgcmVzb3VyY2UgbmFtZSAoYWxwaGFudW1lcmljLCBoeXBoZW5zLCB1bmRlcnNjb3JlcylcbiAgICovXG4gIHN0YXRpYyB2YWxpZGF0ZUF3c1Jlc291cmNlTmFtZShuYW1lOiBzdHJpbmcsIGZpZWxkTmFtZTogc3RyaW5nID0gJ25hbWUnKTogVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgY29uc3QgdmFsaWRhdG9yID0gbmV3IChjbGFzcyBleHRlbmRzIEJhc2VWYWxpZGF0b3I8c3RyaW5nPiB7XG4gICAgICB2YWxpZGF0ZShjb25maWc6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMudmFsaWRhdGVSZXF1aXJlZChjb25maWcsIGZpZWxkTmFtZSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVSZXN1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFXUyByZXNvdXJjZSBuYW1lcyB0eXBpY2FsbHkgYWxsb3cgYWxwaGFudW1lcmljLCBoeXBoZW5zLCBhbmQgdW5kZXJzY29yZXNcbiAgICAgICAgY29uc3QgbmFtZVBhdHRlcm4gPSAvXlthLXpBLVowLTlfLV0rJC87XG4gICAgICAgIHRoaXMudmFsaWRhdGVQYXR0ZXJuKGNvbmZpZywgbmFtZVBhdHRlcm4sIGZpZWxkTmFtZSwgJ2FscGhhbnVtZXJpYyBjaGFyYWN0ZXJzLCBoeXBoZW5zLCBhbmQgdW5kZXJzY29yZXMgb25seScpO1xuXG4gICAgICAgIC8vIENoZWNrIGxlbmd0aCBjb25zdHJhaW50cyAoY29tbW9uIEFXUyBsaW1pdClcbiAgICAgICAgaWYgKGNvbmZpZy5sZW5ndGggPiA2Mykge1xuICAgICAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgICAgICBgJHtmaWVsZE5hbWV9IG11c3QgYmUgNjMgY2hhcmFjdGVycyBvciBsZXNzLCBnb3QgJHtjb25maWcubGVuZ3RofWAsXG4gICAgICAgICAgICBgUGxlYXNlIHNob3J0ZW4gdGhlICR7ZmllbGROYW1lfSB0byA2MyBjaGFyYWN0ZXJzIG9yIGxlc3NgXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25maWcubGVuZ3RoIDwgMSkge1xuICAgICAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgICAgICBgJHtmaWVsZE5hbWV9IG11c3QgYmUgYXQgbGVhc3QgMSBjaGFyYWN0ZXIgbG9uZ2AsXG4gICAgICAgICAgICBgUGxlYXNlIHByb3ZpZGUgYSAke2ZpZWxkTmFtZX0gd2l0aCBhdCBsZWFzdCAxIGNoYXJhY3RlcmBcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlUmVzdWx0KCk7XG4gICAgICB9XG4gICAgfSkoKTtcblxuICAgIHJldHVybiB2YWxpZGF0b3IudmFsaWRhdGUobmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgUzMgYnVja2V0IG5hbWVcbiAgICovXG4gIHN0YXRpYyB2YWxpZGF0ZVMzQnVja2V0TmFtZShidWNrZXROYW1lOiBzdHJpbmcpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICBjb25zdCB2YWxpZGF0b3IgPSBuZXcgKGNsYXNzIGV4dGVuZHMgQmFzZVZhbGlkYXRvcjxzdHJpbmc+IHtcbiAgICAgIHZhbGlkYXRlKGNvbmZpZzogc3RyaW5nKTogVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy52YWxpZGF0ZVJlcXVpcmVkKGNvbmZpZywgJ2J1Y2tldCBuYW1lJykpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVSZXN1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFMzIGJ1Y2tldCBuYW1pbmcgcnVsZXNcbiAgICAgICAgY29uc3QgYnVja2V0TmFtZVBhdHRlcm4gPSAvXlthLXowLTkuLV0rJC87XG4gICAgICAgIGlmICghdGhpcy52YWxpZGF0ZVBhdHRlcm4oY29uZmlnLCBidWNrZXROYW1lUGF0dGVybiwgJ2J1Y2tldCBuYW1lJywgJ2xvd2VyY2FzZSBsZXR0ZXJzLCBudW1iZXJzLCBkb3RzLCBhbmQgaHlwaGVucyBvbmx5JykpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVSZXN1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZGl0aW9uYWwgUzMgYnVja2V0IG5hbWUgcnVsZXNcbiAgICAgICAgaWYgKGNvbmZpZy5sZW5ndGggPCAzIHx8IGNvbmZpZy5sZW5ndGggPiA2Mykge1xuICAgICAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgICAgICAnUzMgYnVja2V0IG5hbWUgbXVzdCBiZSBiZXR3ZWVuIDMgYW5kIDYzIGNoYXJhY3RlcnMgbG9uZycsXG4gICAgICAgICAgICAnUGxlYXNlIGFkanVzdCB0aGUgYnVja2V0IG5hbWUgbGVuZ3RoIHRvIGJlIGJldHdlZW4gMyBhbmQgNjMgY2hhcmFjdGVycydcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmZpZy5zdGFydHNXaXRoKCcuJykgfHwgY29uZmlnLmVuZHNXaXRoKCcuJykpIHtcbiAgICAgICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICAgICAgJ1MzIGJ1Y2tldCBuYW1lIGNhbm5vdCBzdGFydCBvciBlbmQgd2l0aCBhIGRvdCcsXG4gICAgICAgICAgICAnUGxlYXNlIHJlbW92ZSBkb3RzIGZyb20gdGhlIGJlZ2lubmluZyBvciBlbmQgb2YgdGhlIGJ1Y2tldCBuYW1lJ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29uZmlnLmluY2x1ZGVzKCcuLicpKSB7XG4gICAgICAgICAgdGhpcy5hZGRFcnJvcihcbiAgICAgICAgICAgICdTMyBidWNrZXQgbmFtZSBjYW5ub3QgY29udGFpbiBjb25zZWN1dGl2ZSBkb3RzJyxcbiAgICAgICAgICAgICdQbGVhc2UgcmVtb3ZlIGNvbnNlY3V0aXZlIGRvdHMgZnJvbSB0aGUgYnVja2V0IG5hbWUnXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVJlc3VsdCgpO1xuICAgICAgfVxuICAgIH0pKCk7XG5cbiAgICByZXR1cm4gdmFsaWRhdG9yLnZhbGlkYXRlKGJ1Y2tldE5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIFMzIHByZWZpeCAoa2V5IHByZWZpeClcbiAgICovXG4gIHN0YXRpYyB2YWxpZGF0ZVMzUHJlZml4KHByZWZpeDogc3RyaW5nKTogVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgY29uc3QgdmFsaWRhdG9yID0gbmV3IChjbGFzcyBleHRlbmRzIEJhc2VWYWxpZGF0b3I8c3RyaW5nPiB7XG4gICAgICB2YWxpZGF0ZShjb25maWc6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIFxuICAgICAgICAvLyBTMyBwcmVmaXggY2FuIGJlIGVtcHR5LCBzbyB3ZSBkb24ndCByZXF1aXJlIGl0XG4gICAgICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCB8fCBjb25maWcgPT09IG51bGwgfHwgY29uZmlnID09PSAnJykge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVJlc3VsdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUzMga2V5IG5hbWluZyBydWxlcyBhcmUgbW9yZSBwZXJtaXNzaXZlIHRoYW4gYnVja2V0IG5hbWVzXG4gICAgICAgIGlmIChjb25maWcubGVuZ3RoID4gMTAyNCkge1xuICAgICAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgICAgICAnUzMgcHJlZml4IG11c3QgYmUgMTAyNCBjaGFyYWN0ZXJzIG9yIGxlc3MnLFxuICAgICAgICAgICAgJ1BsZWFzZSBzaG9ydGVuIHRoZSBTMyBwcmVmaXggdG8gMTAyNCBjaGFyYWN0ZXJzIG9yIGxlc3MnXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdhcm4gYWJvdXQgdHJhaWxpbmcgc2xhc2hcbiAgICAgICAgaWYgKCFjb25maWcuZW5kc1dpdGgoJy8nKSAmJiBjb25maWcubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHRoaXMuYWRkV2FybmluZyhcbiAgICAgICAgICAgICdTMyBwcmVmaXggc2hvdWxkIHR5cGljYWxseSBlbmQgd2l0aCBhIGZvcndhcmQgc2xhc2ggKC8pJyxcbiAgICAgICAgICAgICdDb25zaWRlciBhZGRpbmcgYSB0cmFpbGluZyBzbGFzaCB0byB0aGUgUzMgcHJlZml4IGZvciBiZXR0ZXIgb3JnYW5pemF0aW9uJ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVSZXN1bHQoKTtcbiAgICAgIH1cbiAgICB9KSgpO1xuXG4gICAgcmV0dXJuIHZhbGlkYXRvci52YWxpZGF0ZShwcmVmaXgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIERvY2tlciBwcm9qZWN0IHJvb3QgcGF0aFxuICAgKi9cbiAgc3RhdGljIHZhbGlkYXRlRG9ja2VyUHJvamVjdFJvb3QocGF0aDogc3RyaW5nKTogVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgY29uc3QgdmFsaWRhdG9yID0gbmV3IChjbGFzcyBleHRlbmRzIEJhc2VWYWxpZGF0b3I8c3RyaW5nPiB7XG4gICAgICB2YWxpZGF0ZShjb25maWc6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMudmFsaWRhdGVSZXF1aXJlZChjb25maWcsICdwcm9qZWN0IHJvb3QgcGF0aCcpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlUmVzdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCYXNpYyBwYXRoIHZhbGlkYXRpb25cbiAgICAgICAgaWYgKGNvbmZpZy5pbmNsdWRlcygnLi4nKSkge1xuICAgICAgICAgIHRoaXMuYWRkV2FybmluZyhcbiAgICAgICAgICAgICdQcm9qZWN0IHJvb3QgcGF0aCBjb250YWlucyBcIi4uXCIgd2hpY2ggbWF5IGNhdXNlIGlzc3VlcycsXG4gICAgICAgICAgICAnQ29uc2lkZXIgdXNpbmcgYW4gYWJzb2x1dGUgcGF0aCBvciBhIHJlbGF0aXZlIHBhdGggd2l0aG91dCBcIi4uXCInXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGZvciBjb21tb24gRG9ja2VyIGZpbGVzXG4gICAgICAgIGlmICghY29uZmlnLmluY2x1ZGVzKCdEb2NrZXJmaWxlJykgJiYgIWNvbmZpZy5lbmRzV2l0aCgnLycpKSB7XG4gICAgICAgICAgdGhpcy5hZGRXYXJuaW5nKFxuICAgICAgICAgICAgJ1Byb2plY3Qgcm9vdCBzaG91bGQgY29udGFpbiBhIERvY2tlcmZpbGUgb3IgZW5kIHdpdGggXCIvXCInLFxuICAgICAgICAgICAgJ0Vuc3VyZSB0aGUgcHJvamVjdCByb290IGNvbnRhaW5zIHRoZSBuZWNlc3NhcnkgRG9ja2VyIGJ1aWxkIGZpbGVzJ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVSZXN1bHQoKTtcbiAgICAgIH1cbiAgICB9KSgpO1xuXG4gICAgcmV0dXJuIHZhbGlkYXRvci52YWxpZGF0ZShwYXRoKTtcbiAgfVxuXG4gIHN0YXRpYyB2YWxpZGF0ZVRhcmJhbGxJbWFnZUZpbGVQYXRoKGZpbGU6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgIGNvbnN0IHZhbGlkYXRvciA9IG5ldyAoY2xhc3MgZXh0ZW5kcyBCYXNlVmFsaWRhdG9yPHN0cmluZz4ge1xuICAgICAgdmFsaWRhdGUoY29uZmlnOiBzdHJpbmcpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICAgICAgdGhpcy5yZXNldCgpO1xuXG4gICAgICAgIGlmICghdGhpcy52YWxpZGF0ZVJlcXVpcmVkKGNvbmZpZywgJ2ltYWdlIGZpbGUgcGF0aCcpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlUmVzdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCYXNpYyBwYXRoIHZhbGlkYXRpb25cbiAgICAgICAgaWYgKGNvbmZpZy5pbmNsdWRlcygnLi4nKSkge1xuICAgICAgICAgIHRoaXMuYWRkV2FybmluZyhcbiAgICAgICAgICAgICdJbWFnZSBmaWxlIHBhdGggY29udGFpbnMgXCIuLlwiIHdoaWNoIG1heSBjYXVzZSBpc3N1ZXMnLFxuICAgICAgICAgICAgJ0NvbnNpZGVyIHVzaW5nIGFuIGFic29sdXRlIHBhdGggb3IgYSByZWxhdGl2ZSBwYXRoIHdpdGhvdXQgXCIuLlwiJ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgcGF0aCBwb2ludHMgdG8gYSBmaWxlIHRoYXQgZXhpc3RzXG4gICAgICAgIGlmICghY29uZmlnLmVuZHNXaXRoKCcudGFyJykpIHtcbiAgICAgICAgICB0aGlzLmFkZFdhcm5pbmcoXG4gICAgICAgICAgICAnSW1hZ2UgZmlsZSBwYXRoIGRvZXMgbm90IHBvaW50IHRvIGEgLnRhcicsXG4gICAgICAgICAgICAnRW5zdXJlIHRoZSBpbWFnZSBmaWxlIHBhdGggcG9pbnRzIHRvIGEgdmFsaWQgVGFyIGltYWdlIGZpbGUnXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggZnMuZXhpc3RzU3luYyhjb25maWcpID09PSBmYWxzZSkge1xuICAgICAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgICAgICAnSW1hZ2UgZmlsZSBwYXRoIGRvZXMgbm90IGV4aXN0JyxcbiAgICAgICAgICAgICdFbnN1cmUgdGhlIGltYWdlIGZpbGUgcGF0aCBwb2ludHMgdG8gYSB2YWxpZCBUYXIgaW1hZ2UgZmlsZSdcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlUmVzdWx0KCk7XG4gICAgICB9XG4gICAgfSkoKTtcblxuICAgIHJldHVybiB2YWxpZGF0b3IudmFsaWRhdGUoZmlsZSk7XG4gIH1cblxuICAvKipcbiAgICogQ29tYmluZSBtdWx0aXBsZSB2YWxpZGF0aW9uIHJlc3VsdHNcbiAgICovXG4gIHN0YXRpYyBjb21iaW5lVmFsaWRhdGlvblJlc3VsdHMocmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdKTogVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgY29uc3QgY29tYmluZWQ6IFZhbGlkYXRpb25SZXN1bHQgPSB7XG4gICAgICBpc1ZhbGlkOiB0cnVlLFxuICAgICAgZXJyb3JzOiBbXSxcbiAgICAgIHdhcm5pbmdzOiBbXSxcbiAgICAgIHN1Z2dlc3Rpb25zOiBbXSxcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgaWYgKCFyZXN1bHQuaXNWYWxpZCkge1xuICAgICAgICBjb21iaW5lZC5pc1ZhbGlkID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBjb21iaW5lZC5lcnJvcnMucHVzaCguLi5yZXN1bHQuZXJyb3JzKTtcbiAgICAgIGNvbWJpbmVkLndhcm5pbmdzLnB1c2goLi4ucmVzdWx0Lndhcm5pbmdzKTtcbiAgICAgIGlmIChyZXN1bHQuc3VnZ2VzdGlvbnMpIHtcbiAgICAgICAgY29tYmluZWQuc3VnZ2VzdGlvbnMhLnB1c2goLi4ucmVzdWx0LnN1Z2dlc3Rpb25zKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgc3VnZ2VzdGlvbnMgaWYgZW1wdHlcbiAgICBpZiAoY29tYmluZWQuc3VnZ2VzdGlvbnMhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZGVsZXRlIGNvbWJpbmVkLnN1Z2dlc3Rpb25zO1xuICAgIH1cblxuICAgIHJldHVybiBjb21iaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaHJvdyBhIENvbnN0cnVjdEVycm9yIGlmIHZhbGlkYXRpb24gZmFpbHNcbiAgICovXG4gIHN0YXRpYyB0aHJvd0lmSW52YWxpZChyZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHQsIGNvbnN0cnVjdE5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghcmVzdWx0LmlzVmFsaWQpIHtcbiAgICAgIHRocm93IG5ldyBDb25zdHJ1Y3RFcnJvcihcbiAgICAgICAgY29uc3RydWN0TmFtZSxcbiAgICAgICAgJ1ZBTElEQVRJT04nLFxuICAgICAgICBgQ29uZmlndXJhdGlvbiB2YWxpZGF0aW9uIGZhaWxlZDogJHtyZXN1bHQuZXJyb3JzLmpvaW4oJywgJyl9YCxcbiAgICAgICAgcmVzdWx0LnN1Z2dlc3Rpb25zXG4gICAgICApO1xuICAgIH1cbiAgfVxufSJdfQ==