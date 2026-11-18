const { body } = require('express-validator');

const registerValidator = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('Le prénom est obligatoire.')
    .isLength({ max: 50 }).withMessage('Le prénom ne doit pas dépasser 50 caractères.'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Le nom est obligatoire.')
    .isLength({ max: 50 }).withMessage('Le nom ne doit pas dépasser 50 caractères.'),

  body('email')
    .trim()
    .notEmpty().withMessage("L'email est obligatoire.")
    .isEmail().withMessage('Format email invalide.')
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),

  body('password')
    .notEmpty().withMessage('Le mot de passe est obligatoire.')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.'),

  body('phone')
    .optional()
    .trim(),

  body('role')
    .optional()
    .isIn(['client', 'company']).withMessage('Rôle invalide.'),

  body('companyName')
    .if(body('role').equals('company'))
    .trim()
    .notEmpty().withMessage('Le nom de la société est obligatoire.')
    .isLength({ max: 100 }).withMessage('Le nom ne doit pas dépasser 100 caractères.'),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage("L'email est obligatoire.")
    .isEmail().withMessage('Format email invalide.')
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),

  body('password')
    .notEmpty().withMessage('Le mot de passe est obligatoire.'),

  body('role')
    .optional()
    .isIn(['client', 'company', 'admin']).withMessage('Rôle spécifié invalide.'),
];

const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Le mot de passe actuel est obligatoire.'),

  body('newPassword')
    .notEmpty().withMessage('Le nouveau mot de passe est obligatoire.')
    .isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères.'),
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage("L'email est obligatoire.")
    .isEmail().withMessage('Format email invalide.')
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Token obligatoire.'),
  body('email').trim().isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Le mot de passe est obligatoire.')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères.'),
];

module.exports = {
  registerValidator,
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};

