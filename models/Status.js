import mongoose from "mongoose";
const StatusSchema=new mongoose.Schema({
    tableNo: { type: Number, required: true, unique: true },
    status: { type: String, default: 'gray', enum: ['gray', 'yellow', 'red', 'green'] }
})

const Status = mongoose.model('Status',StatusSchema)
export default Status