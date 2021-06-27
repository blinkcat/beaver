import mri from 'mri';
import CoreService from './coreService';

const args = mri(process.argv.slice(2));

new CoreService().run(args._[0], args);
