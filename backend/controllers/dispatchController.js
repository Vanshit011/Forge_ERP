import Dispatch from '../models/Dispatch.js';
import Forging from '../models/Forging.js';

// @desc    Create new dispatch record
// @route   POST /api/dispatch
export const createDispatch = async (req, res) => {
    try {
        const { forgingId, dispatchQty } = req.body;

        // 1. Verify Forging Record Exists
        const forging = await Forging.findById(forgingId);
        if (!forging) {
            return res.status(404).json({ success: false, message: 'Forging record not found' });
        }

        // 2. Check Availability
        // Get total previously dispatched for this forging ID
        const previousDispatches = await Dispatch.find({ forgingId });
        const totalDispatched = previousDispatches.reduce((sum, d) => sum + d.dispatchQty, 0);

        const availableQty = forging.forgingResults.finalOkPieces - totalDispatched;

        if (dispatchQty > availableQty) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock! Available: ${availableQty}, Requested: ${dispatchQty}`
            });
        }

        // 3. Create Dispatch
        const dispatch = await Dispatch.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Dispatch record created successfully',
            data: dispatch
        });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all dispatch history
// @route   GET /api/dispatch
export const getAllDispatches = async (req, res) => {
    try {
        const dispatches = await Dispatch.find()
            .populate({
                path: 'forgingId',
                select: 'partName material dia size date' // Select fields to show
            })
            .sort({ date: -1, createdAt: -1 });

        res.status(200).json({ success: true, count: dispatches.length, data: dispatches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Forging Stock that is ready for dispatch (Available > 0)
// @route   GET /api/dispatch/available-stock
export const getAvailableForgingStock = async (req, res) => {
    try {
        // 1. Get all Forging Records
        const forgings = await Forging.find().sort({ date: -1 });

        // 2. Get all Dispatches
        const dispatches = await Dispatch.find();

        // 3. Calculate availability for each forging record
        const stockSummary = forgings.map(forging => {
            const totalDispatched = dispatches
                .filter(d => d.forgingId.toString() === forging._id.toString())
                .reduce((sum, d) => sum + d.dispatchQty, 0);

            const produced = forging.forgingResults.finalOkPieces;
            const remaining = produced - totalDispatched;

            return {
                _id: forging._id,
                date: forging.date,
                partName: forging.partName,
                material: forging.material,
                colorCode: forging.colorCode,
                size: forging.size,
                producedQty: produced,
                dispatchedQty: totalDispatched,
                availableQty: remaining,
                ringWeight: forging.forgingRingWeight
            };
        }).filter(item => item.availableQty > 0); // Only show what has stock left

        res.status(200).json({ success: true, count: stockSummary.length, data: stockSummary });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete dispatch
export const deleteDispatch = async (req, res) => {
    try {
        await Dispatch.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Dispatch deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export default {
    createDispatch,
    getAllDispatches,
    getAvailableForgingStock,
    deleteDispatch
};