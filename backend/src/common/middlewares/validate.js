import { ZodError } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: err.errors.map(({ path, message }) => ({ field: path.join('.'), message })),
      });
    }
    next(err);
  }
};
