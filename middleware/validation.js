const Joi = require('joi');

const validateUser = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.number().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('user', 'admin').default('user')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateBook = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(1).required(),
    author: Joi.string().min(1).required(),
    description: Joi.string().min(10).required(),
    price: Joi.number().min(0).required(),
    image: Joi.string().uri().required(),
    rent: Joi.number().min(0).required(),
    pdfUrl: Joi.string().uri().required(),
    category: Joi.string().default('General'),
    totalCopies: Joi.number().min(1).default(1)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateTransaction = (req, res, next) => {
  const schema = Joi.object({
    items: Joi.array().items(
      Joi.object({
        bookId: Joi.string().required(),
        type: Joi.string().valid('buy', 'borrow').required()
      })
    ).min(1).required(),
    paymentMethod: Joi.string().default('card')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateAppointment = (req, res, next) => {
  const schema = Joi.object({
    subject: Joi.string().min(3).required(),
    details: Joi.string().min(10).required(),
    date: Joi.date().min('now').required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateComment = (req, res, next) => {
  const schema = Joi.object({
    bookId: Joi.string(),
    content: Joi.string().min(5).required(),
    rating: Joi.number().min(1).max(5)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateUser,
  validateLogin,
  validateBook,
  validateTransaction,
  validateAppointment,
  validateComment
};
