import dotenv from 'dotenv';
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
export default mongoURI; 