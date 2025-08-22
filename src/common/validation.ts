/**
 * Configuration validation utilities for CDK constructs
 */

import { ValidationResult, ConfigValidator, ConstructError } from './interfaces';
import fs from "fs";

/**
 * Base validator class that provides common validation utilities
 */
export abstract class BaseValidator<T> implements ConfigValidator<T> {
  protected errors: string[] = [];
  protected warnings: string[] = [];
  protected suggestions: string[] = [];

  abstract validate(config: T): ValidationResult;

  /**
   * Reset validation state
   */
  protected reset(): void {
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
  }

  /**
   * Add a validation error
   */
  protected addError(message: string, suggestion?: string): void {
    this.errors.push(message);
    if (suggestion) {
      this.suggestions.push(suggestion);
    }
  }

  /**
   * Add a validation warning
   */
  protected addWarning(message: string, suggestion?: string): void {
    this.warnings.push(message);
    if (suggestion) {
      this.suggestions.push(suggestion);
    }
  }

  /**
   * Create validation result
   */
  protected createResult(): ValidationResult {
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
  protected validateRequired(value: any, fieldName: string): boolean {
    if (value === undefined || value === null || value === '') {
      this.addError(
        `${fieldName} is required`,
        `Please provide a value for ${fieldName}`
      );
      return false;
    }
    return true;
  }

  /**
   * Validate that a string matches a pattern
   */
  protected validatePattern(value: string, pattern: RegExp, fieldName: string, description: string): boolean {
    if (!pattern.test(value)) {
      this.addError(
        `${fieldName} does not match required pattern: ${description}`,
        `Please ensure ${fieldName} follows the format: ${description}`
      );
      return false;
    }
    return true;
  }

  /**
   * Validate that a number is within a range
   */
  protected validateRange(value: number, min: number, max: number, fieldName: string): boolean {
    if (value < min || value > max) {
      this.addError(
        `${fieldName} must be between ${min} and ${max}, got ${value}`,
        `Please set ${fieldName} to a value between ${min} and ${max}`
      );
      return false;
    }
    return true;
  }

  /**
   * Validate that an array is not empty
   */
  protected validateNonEmptyArray(value: any[], fieldName: string): boolean {
    if (!Array.isArray(value) || value.length === 0) {
      this.addError(
        `${fieldName} must be a non-empty array`,
        `Please provide at least one item in ${fieldName}`
      );
      return false;
    }
    return true;
  }

  /**
   * Validate that a value is one of the allowed options
   */
  protected validateEnum<T>(value: T, allowedValues: T[], fieldName: string): boolean {
    if (!allowedValues.includes(value)) {
      this.addError(
        `${fieldName} must be one of: ${allowedValues.join(', ')}, got ${value}`,
        `Please set ${fieldName} to one of the allowed values: ${allowedValues.join(', ')}`
      );
      return false;
    }
    return true;
  }
}

/**
 * Utility functions for common validation scenarios
 */
export class ValidationUtils {
  /**
   * Validate AWS resource name (alphanumeric, hyphens, underscores)
   */
  static validateAwsResourceName(name: string, fieldName: string = 'name'): ValidationResult {
    const validator = new (class extends BaseValidator<string> {
      validate(config: string): ValidationResult {
        this.reset();
        
        if (!this.validateRequired(config, fieldName)) {
          return this.createResult();
        }

        // AWS resource names typically allow alphanumeric, hyphens, and underscores
        const namePattern = /^[a-zA-Z0-9_-]+$/;
        this.validatePattern(config, namePattern, fieldName, 'alphanumeric characters, hyphens, and underscores only');

        // Check length constraints (common AWS limit)
        if (config.length > 63) {
          this.addError(
            `${fieldName} must be 63 characters or less, got ${config.length}`,
            `Please shorten the ${fieldName} to 63 characters or less`
          );
        }

        if (config.length < 1) {
          this.addError(
            `${fieldName} must be at least 1 character long`,
            `Please provide a ${fieldName} with at least 1 character`
          );
        }

        return this.createResult();
      }
    })();

    return validator.validate(name);
  }

  /**
   * Validate S3 bucket name
   */
  static validateS3BucketName(bucketName: string): ValidationResult {
    const validator = new (class extends BaseValidator<string> {
      validate(config: string): ValidationResult {
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
          this.addError(
            'S3 bucket name must be between 3 and 63 characters long',
            'Please adjust the bucket name length to be between 3 and 63 characters'
          );
        }

        if (config.startsWith('.') || config.endsWith('.')) {
          this.addError(
            'S3 bucket name cannot start or end with a dot',
            'Please remove dots from the beginning or end of the bucket name'
          );
        }

        if (config.includes('..')) {
          this.addError(
            'S3 bucket name cannot contain consecutive dots',
            'Please remove consecutive dots from the bucket name'
          );
        }

        return this.createResult();
      }
    })();

    return validator.validate(bucketName);
  }

  /**
   * Validate S3 prefix (key prefix)
   */
  static validateS3Prefix(prefix: string): ValidationResult {
    const validator = new (class extends BaseValidator<string> {
      validate(config: string): ValidationResult {
        this.reset();
        
        // S3 prefix can be empty, so we don't require it
        if (config === undefined || config === null || config === '') {
          return this.createResult();
        }

        // S3 key naming rules are more permissive than bucket names
        if (config.length > 1024) {
          this.addError(
            'S3 prefix must be 1024 characters or less',
            'Please shorten the S3 prefix to 1024 characters or less'
          );
        }

        // Warn about trailing slash
        if (!config.endsWith('/') && config.length > 0) {
          this.addWarning(
            'S3 prefix should typically end with a forward slash (/)',
            'Consider adding a trailing slash to the S3 prefix for better organization'
          );
        }

        return this.createResult();
      }
    })();

    return validator.validate(prefix);
  }

  /**
   * Validate Docker project root path
   */
  static validateDockerProjectRoot(path: string): ValidationResult {
    const validator = new (class extends BaseValidator<string> {
      validate(config: string): ValidationResult {
        this.reset();
        
        if (!this.validateRequired(config, 'project root path')) {
          return this.createResult();
        }

        // Basic path validation
        if (config.includes('..')) {
          this.addWarning(
            'Project root path contains ".." which may cause issues',
            'Consider using an absolute path or a relative path without ".."'
          );
        }

        // Check for common Docker files
        if (!config.includes('Dockerfile') && !config.endsWith('/')) {
          this.addWarning(
            'Project root should contain a Dockerfile or end with "/"',
            'Ensure the project root contains the necessary Docker build files'
          );
        }

        return this.createResult();
      }
    })();

    return validator.validate(path);
  }

  static validateTarballImageFilePath(file: string): ValidationResult {
    const validator = new (class extends BaseValidator<string> {
      validate(config: string): ValidationResult {
        this.reset();

        if (!this.validateRequired(config, 'image file path')) {
          return this.createResult();
        }

        // Basic path validation
        if (config.includes('..')) {
          this.addWarning(
            'Image file path contains ".." which may cause issues',
            'Consider using an absolute path or a relative path without ".."'
          );
        }

        // Check if the path points to a file that exists
        if (!config.endsWith('.tar')) {
          this.addWarning(
            'Image file path does not point to a .tar',
            'Ensure the image file path points to a valid Tar image file'
          );
        }

        if ( fs.existsSync(config) === false) {
          this.addError(
            'Image file path does not exist',
            'Ensure the image file path points to a valid Tar image file'
          );
        }

        return this.createResult();
      }
    })();

    return validator.validate(file);
  }

  /**
   * Combine multiple validation results
   */
  static combineValidationResults(results: ValidationResult[]): ValidationResult {
    const combined: ValidationResult = {
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
        combined.suggestions!.push(...result.suggestions);
      }
    }

    // Remove suggestions if empty
    if (combined.suggestions!.length === 0) {
      delete combined.suggestions;
    }

    return combined;
  }

  /**
   * Throw a ConstructError if validation fails
   */
  static throwIfInvalid(result: ValidationResult, constructName: string): void {
    if (!result.isValid) {
      throw new ConstructError(
        constructName,
        'VALIDATION',
        `Configuration validation failed: ${result.errors.join(', ')}`,
        result.suggestions
      );
    }
  }
}