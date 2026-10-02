import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
export function auth(req:Request,res:Response,next:NextFunction){const token=req.headers.authorization?.split(' ');if(token?.[0]!=='Bearer'||!process.env.JWT_SECRET)return void res.status(401).json({message:'Autenticação necessária.'});try{const claims=jwt.verify(token[1],process.env.JWT_SECRET,{algorithms:['HS256'],issuer:'heraia',audience:'heraia-admin'}) as jwt.JwtPayload;if(claims.role!=='admin')throw new Error();next();}catch{res.status(401).json({message:'Sessão inválida ou expirada.'});}}
