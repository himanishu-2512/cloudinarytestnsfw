const express = require('express');
const app = express();
const cloudinary = require('cloudinary')
const multer = require('multer')

const mongoose = require('mongoose');
const uri = "mongodb+srv://abhinav_passport_project:abhinav123@cluster0.ipq1n.mongodb.net/imagedb?retryWrites=true&w=majority";


// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname); // Specify the directory where you want to store the uploaded files
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });


const connectDatabase = () => {
    mongoose
        .connect(uri)
        .then((con) => console.log(`Database Connected: ${con.connection.host}`))
        .catch((err) => console.log(err));
};
connectDatabase();

cloudinary.config({
    cloud_name: 'dtiaeqgsa',
    api_key: '494367314758931',
    api_secret: 'DZEuH3Hg_27PT5B6nvjOuifhieU'
});

const imageSchema = new mongoose.Schema({
    image_id: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    url: {
        type: String,
        required: true
    }
});

const Image = mongoose.model('Image', imageSchema);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
const router = express.Router();

router.route("/").get((req, res) => {
    res.status(200).send("HELLO Deployed success")
})

router.route("/postimage").post(upload.single('image'), async (req, res) => {
    try {
        const myCloud = await cloudinary.v2.uploader
            .upload(req.file.filename, {
                moderation: "webpurify",
                notification_url: `http://localhost:4000/deleteimage`
            })

        const image = {
            image_id: myCloud.public_id,
            url: myCloud.secure_url
        }

        console.log(image);

        const img = await Image.create(image);


        res.status(200).json({
            success: true,
            details: img
        });

    } catch (error) {
        res.status(500).json({
            err: error.message
        });
    }
});

router.route("/deleteimage").delete(async (req, res) => {
    try {
        if (req.body.moderation_status === "rejected") {
            const image = await Image.findOne({ image_id: req.body.public_id });

            await cloudinary.v2.uploader.destroy(req.body.public_id);

            await image.deleteOne()

            res.status(200).json({
                success: true,
                message: "Image deleted",
            });

        } else {
            res.status(200).json({
                success: true,
                message: "No need to delete image",
            });
        }

    } catch (error) {
        res.status(500).json({
            err: error.message
        });
    }
});

app.use("/", router);

app.listen(4000, () => {
    console.log(`Server is running on port ${4000}`);
});
