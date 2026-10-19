import fs from "node:fs";
import {createRequire} from "node:module";
import ts from "typescript";
const nativeRequire=createRequire(import.meta.url);
export function createGalleryLoader(mocks={}) {
 const cache=new Map();
 function load(file){
  if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);
  new Function("exports","require",ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(exports,name=>Object.hasOwn(mocks,name)?mocks[name]:name.startsWith("@/")?load(name.slice(2)+".ts"):nativeRequire(name));
  return exports;
 }
 return load;
}
