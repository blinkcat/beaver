import resolve from 'resolve';

export default [
  resolve.sync('./methods'),
  resolve.sync('./logger'),
  resolve.sync('./autoStartServer'),
  // commands
  resolve.sync('./commands/dev'),
  resolve.sync('./commands/build'),
  resolve.sync('./commands/debug'),
];
