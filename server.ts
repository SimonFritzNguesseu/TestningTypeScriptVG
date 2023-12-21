import express, { json, Request, Response } from 'express';
import mongoose, { Document, Schema, Model } from 'mongoose';
mongoose.set('strictQuery', false);
import axios from 'axios';
import { validateEmail, validateZipCode, validatePersonalNumber, validateText } from './validation';

const app = express();
app.use(json());

interface IContact extends Document {
    firstname: string;
    lastname: string;
    email: string;
    personalnumber: string;
    address: string;
    zipCode: string;
    city: string;
    country: string;
    lat?: number;
    lng?: number;
}

const contactSchema = new Schema<IContact>({
    firstname: { type: String, required: true, validate: { validator: validateText, message: 'Invalid firstname' } },
    lastname: { type: String, required: true, validate: { validator: validateText, message: 'Invalid lastname' } },
    email: { type: String, required: true, validate: { validator: validateEmail, message: 'Invalid email' } },
    personalnumber: { type: String, required: true, validate: { validator: validatePersonalNumber, message: 'Invalid personal number' } },
    address: { type: String, required: true, validate: { validator: validateText, message: 'Invalid address' } },
    zipCode: { type: String, required: true, validate: { validator: validateZipCode, message: 'Invalid zip code' } },
    city: { type: String, required: true, validate: { validator: validateText, message: 'Invalid city' } },
    country: { type: String, required: true, validate: { validator: validateText, message: 'Invalid country' } },
    lat: Number,
    lng: Number,
});

export const ContactModel: Model<IContact> = mongoose.model<IContact>("contact", contactSchema);


app.post('/contact', async (req: Request, res: Response) => {
    const { firstname, lastname, email, personalnumber, address, zipCode, city, country } = req.body;

    try {
        if (!validateText(firstname) || !validateText(lastname) || !validateText(address) || !validateText(city) || !validateText(country)) {
            return res.status(400).json({ error: 'Invalid input data' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!validateZipCode(zipCode)) {
            return res.status(400).json({ error: 'Invalid zip code format' });
        }

        if (!validatePersonalNumber(personalnumber)) {
            return res.status(400).json({ error: 'Invalid personal number format' });
        }

        const contact = new ContactModel({ firstname, lastname, email, personalnumber, address, zipCode, city, country });
        const savedContact = await contact.save();
        res.status(201).json(savedContact);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/contact', async (_req: Request, res: Response) => {
    try {
        const contacts = await ContactModel.find({});
        res.status(200).json(contacts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/contact/:id', async (req: Request, res: Response) => {
    try {
        const contact = await ContactModel.findById(req.params.id);

        if (!contact) {
            return res.status(404).send();
        }

        const address = encodeURIComponent(`${contact.address}, ${contact.city}, ${contact.country}`);
        const coordinatesAPI = await axios.get(`https://api-ninjas.com/api/geocoding?address=${address}`);
        contact.lat = coordinatesAPI.data.lat;
        contact.lng = coordinatesAPI.data.lng;

        res.status(200).json(contact);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

const port = process.env.PORT || 8080;

mongoose.connect("mongodb://localhost:27017").then(() => {
    app.listen(port, () => {
        console.log(`App listening to port ${port}`);
    });
}).catch(err => console.error(err));


export default app;
