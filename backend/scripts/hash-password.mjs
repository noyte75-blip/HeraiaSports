import readline from 'node:readline';
import { Writable } from 'node:stream';
import bcrypt from 'bcryptjs';
if (!process.stdin.isTTY) throw new Error('Execute em um terminal interativo.');
const muted = new Writable({write(_chunk, _encoding, callback) {callback();}});
const rl = readline.createInterface({input:process.stdin,output:muted,terminal:true});
process.stderr.write('Senha administrativa (entrada oculta): ');
rl.question('',async password=>{rl.close();if(password.length<12 || Buffer.byteLength(password)>72){console.error('Use pelo menos 12 caracteres e no máximo 72 bytes.');process.exitCode=1;return;}console.log('\n'+await bcrypt.hash(password,12));});
