/**
 * Async Handler Utility
 * Wraps asynchronous route controllers to catch rejections and pass them to the global error middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
