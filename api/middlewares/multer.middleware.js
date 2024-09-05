import multer from "multer";
import path from "path";
import fs from "fs"

const uploadDirectory = path.resolve('./public/temp');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp'); // Specify the directory for storing uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Specify the filename for the uploaded file
    }
});

export const upload = multer({
    storage
})