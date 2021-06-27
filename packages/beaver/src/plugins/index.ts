import resolve from 'resolve';

export default [resolve.sync('./methods'), resolve.sync('./commands/dev'), resolve.sync('./commands/build')];
