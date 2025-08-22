"use strict";
/**
 * Reusable AWS CDK Constructs Library
 *
 * This library provides production-ready CDK constructs for AWS Bedrock Agent Core
 * and Knowledge Base deployment with best-practice security configurations.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockKnowledgeBase = exports.BedrockAgentCoreRuntimeAgent = void 0;
// Bedrock Agent Core constructs
var bedrock_agentcore_runtime_agent_1 = require("./constructs/bedrock-agentcore/bedrock-agentcore-runtime-agent");
Object.defineProperty(exports, "BedrockAgentCoreRuntimeAgent", { enumerable: true, get: function () { return bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent; } });
var bedrock_knowledge_base_1 = require("./constructs/bedrock/bedrock-knowledge-base");
Object.defineProperty(exports, "BedrockKnowledgeBase", { enumerable: true, get: function () { return bedrock_knowledge_base_1.BedrockKnowledgeBase; } });
// Common interfaces and utilities
__exportStar(require("./common/interfaces"), exports);
__exportStar(require("./common/validation"), exports);
__exportStar(require("./common/defaults"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7OztHQUtHOzs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGdDQUFnQztBQUNoQyxrSEFBOEc7QUFBckcsK0lBQUEsNEJBQTRCLE9BQUE7QUFDckMsc0ZBQW1GO0FBQTFFLDhIQUFBLG9CQUFvQixPQUFBO0FBTTdCLGtDQUFrQztBQUNsQyxzREFBb0M7QUFDcEMsc0RBQW9DO0FBQ3BDLG9EQUFrQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUmV1c2FibGUgQVdTIENESyBDb25zdHJ1Y3RzIExpYnJhcnlcbiAqIFxuICogVGhpcyBsaWJyYXJ5IHByb3ZpZGVzIHByb2R1Y3Rpb24tcmVhZHkgQ0RLIGNvbnN0cnVjdHMgZm9yIEFXUyBCZWRyb2NrIEFnZW50IENvcmVcbiAqIGFuZCBLbm93bGVkZ2UgQmFzZSBkZXBsb3ltZW50IHdpdGggYmVzdC1wcmFjdGljZSBzZWN1cml0eSBjb25maWd1cmF0aW9ucy5cbiAqL1xuXG4vLyBCZWRyb2NrIEFnZW50IENvcmUgY29uc3RydWN0c1xuZXhwb3J0IHsgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudCB9IGZyb20gJy4vY29uc3RydWN0cy9iZWRyb2NrLWFnZW50Y29yZS9iZWRyb2NrLWFnZW50Y29yZS1ydW50aW1lLWFnZW50JztcbmV4cG9ydCB7IEJlZHJvY2tLbm93bGVkZ2VCYXNlIH0gZnJvbSAnLi9jb25zdHJ1Y3RzL2JlZHJvY2svYmVkcm9jay1rbm93bGVkZ2UtYmFzZSc7XG5cbi8vIEV4cG9ydCB0eXBlcyBmb3IgY29uc3RydWN0IHByb3BlcnRpZXNcbmV4cG9ydCB0eXBlIHsgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudFByb3BzIH0gZnJvbSAnLi9jb25zdHJ1Y3RzL2JlZHJvY2stYWdlbnRjb3JlL2JlZHJvY2stYWdlbnRjb3JlLXJ1bnRpbWUtYWdlbnQnO1xuZXhwb3J0IHR5cGUgeyBLbm93bGVkZ2VCYXNlUHJvcHMgfSBmcm9tICcuL2NvbnN0cnVjdHMvYmVkcm9jay9iZWRyb2NrLWtub3dsZWRnZS1iYXNlJztcblxuLy8gQ29tbW9uIGludGVyZmFjZXMgYW5kIHV0aWxpdGllc1xuZXhwb3J0ICogZnJvbSAnLi9jb21tb24vaW50ZXJmYWNlcyc7XG5leHBvcnQgKiBmcm9tICcuL2NvbW1vbi92YWxpZGF0aW9uJztcbmV4cG9ydCAqIGZyb20gJy4vY29tbW9uL2RlZmF1bHRzJzsiXX0=