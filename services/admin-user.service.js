const userRepository = require('../repositories/user.repository');

async function approveUserAction(userId) {
  const user = await userRepository.getUserById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  if (user.status !== 'pending' && user.status !== 'banned') {
    throw {
      status: 400,
      message: 'Only pending or banned users can be approved',
    };
  }

  await userRepository.approveUser(userId);
  return user;
}

async function banUserAction(userId) {
  const user = await userRepository.getUserById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  if (user.status === 'removed') {
    throw {
      status: 400,
      message: 'Cannot ban a removed user',
    };
  }

  await userRepository.banUser(userId);
  return user;
}

async function removeUserAction(userId) {
  const user = await userRepository.getUserById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  await userRepository.removeUser(userId);
  return user;
}

async function restoreUserAction(userId) {
  const user = await userRepository.getUserById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  if (user.status !== 'removed') {
    throw {
      status: 400,
      message: 'Only removed users can be restored',
    };
  }

  const success = await userRepository.restoreUser(userId);
  if (!success) {
    throw {
      status: 400,
      message: 'Could not restore user',
    };
  }

  return user;
}

module.exports = {
  approveUserAction,
  banUserAction,
  removeUserAction,
  restoreUserAction,
};
