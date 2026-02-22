const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware для проверки JWT токена
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: User,
            as: 'children',
            attributes: ['id', 'username', 'childName', 'age']
          }
        ]
      });

      if (!req.user || !req.user.isActive) {
        return res.status(401).json({ message: 'Пользователь не найден или неактивен' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Не авторизован, токен недействителен' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Не авторизован, токен отсутствует' });
  }
};

// Middleware для проверки роли пользователя
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Роль ${req.user.role} не имеет доступа к этому ресурсу` 
      });
    }
    next();
  };
};

// Middleware для проверки доступа к данным ребенка
exports.checkChildAccess = async (req, res, next) => {
  const childId = req.params.childId || req.body.childId;
  
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'parent') {
    const hasAccess = req.user.children.some(
      child => child.id === parseInt(childId)
    );
    
    if (!hasAccess) {
      return res.status(403).json({ 
        message: 'У вас нет доступа к данным этого ребенка' 
      });
    }
    return next();
  }

  if (req.user.role === 'child' && req.user.id === parseInt(childId)) {
    return next();
  }

  return res.status(403).json({ message: 'Доступ запрещен' });
};
