import {createGalleryLoader} from "./gallery-loader.mjs";
process.loadEnvFile(".env.local");
const load=createGalleryLoader(),{getMongoClient}=load("lib/server/mongodb.ts");
try { console.log("Gallery migration:",await load("lib/server/gallery-migration.ts").migrateGallery()); }
finally { await (await getMongoClient()).close(); }
