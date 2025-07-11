"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tournament = void 0;
const mongoose_1 = require("mongoose");
const tournament_1 = require("../types/tournament");
const common_1 = require("../types/common");
const base_1 = require("./base");
const calculateTournamentStats = (tournament) => {
    if (tournament.date && typeof tournament.date === 'string') {
        tournament.date = new Date(tournament.date);
    }
    if (!tournament.bodNumber) {
        const year = tournament.date.getFullYear();
        const month = tournament.date.getMonth() + 1;
        tournament.bodNumber = parseInt(`${year}${month.toString().padStart(2, '0')}`);
    }
    if (tournament.format) {
        tournament.format = tournament.format.trim();
    }
    if (tournament.location) {
        tournament.location = tournament.location.trim();
    }
};
const tournamentSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: [true, common_1.ErrorMessages.REQUIRED],
        index: true,
        validate: {
            validator: (date) => {
                const minDate = new Date('2009-01-01');
                const maxDate = new Date();
                maxDate.setFullYear(maxDate.getFullYear() + 10);
                return date >= minDate && date <= maxDate;
            },
            message: 'Date must be between 2009 and 10 years in the future',
        },
    },
    bodNumber: {
        type: Number,
        required: [true, common_1.ErrorMessages.REQUIRED],
        unique: true,
        index: true,
        min: [200901, 'BOD number must be valid (format: YYYYMM)'],
        validate: (0, base_1.createNumericValidator)(200901),
    },
    format: {
        type: String,
        required: [true, common_1.ErrorMessages.REQUIRED],
        enum: {
            values: tournament_1.TournamentFormats,
            message: `Format must be one of: ${tournament_1.TournamentFormats.join(', ')}`,
        },
        index: true,
    },
    location: {
        type: String,
        required: [true, common_1.ErrorMessages.REQUIRED],
        trim: true,
        validate: (0, base_1.createStringValidator)(2, 100),
    },
    advancementCriteria: {
        type: String,
        required: [true, common_1.ErrorMessages.REQUIRED],
        trim: true,
        validate: (0, base_1.createStringValidator)(5, 500),
    },
    notes: {
        type: String,
        trim: true,
        validate: (0, base_1.createStringValidator)(1, 1000),
    },
    photoAlbums: {
        type: String,
        trim: true,
        validate: {
            validator: (value) => {
                if (!value)
                    return true;
                const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
                return urlRegex.test(value);
            },
            message: 'Photo albums must be a valid URL',
        },
    },
}, base_1.baseSchemaOptions);
tournamentSchema.path('bodNumber').validate(function (bodNumber) {
    const bodStr = bodNumber.toString();
    if (bodStr.length !== 6)
        return false;
    const year = parseInt(bodStr.substring(0, 4));
    const month = parseInt(bodStr.substring(4, 6));
    return year >= 2009 && month >= 1 && month <= 12;
}, 'BOD number must be in format YYYYMM');
tournamentSchema.path('date').validate(function (date) {
    if (!this.bodNumber)
        return true;
    const bodStr = this.bodNumber.toString();
    const bodYear = parseInt(bodStr.substring(0, 4));
    const bodMonth = parseInt(bodStr.substring(4, 6));
    return date.getFullYear() === bodYear && (date.getMonth() + 1) === bodMonth;
}, 'Date must match BOD number year and month');
tournamentSchema.virtual('formattedDate').get(function () {
    return this.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
});
tournamentSchema.virtual('year').get(function () {
    return this.date.getFullYear();
});
tournamentSchema.virtual('month').get(function () {
    return this.date.getMonth() + 1;
});
tournamentSchema.virtual('season').get(function () {
    const month = this.date.getMonth() + 1;
    if (month >= 3 && month <= 5)
        return 'Spring';
    if (month >= 6 && month <= 8)
        return 'Summer';
    if (month >= 9 && month <= 11)
        return 'Fall';
    return 'Winter';
});
tournamentSchema.methods = { ...base_1.baseMethods };
tournamentSchema.statics = { ...base_1.baseStatics };
tournamentSchema.pre('save', (0, base_1.createPreSaveMiddleware)(calculateTournamentStats));
tournamentSchema.pre('findOneAndUpdate', function () {
    this.setOptions({ runValidators: true });
});
(0, base_1.createIndexes)(tournamentSchema, [
    { fields: { bodNumber: 1 }, options: { unique: true } },
    { fields: { date: -1 } },
    { fields: { format: 1 } },
    { fields: { location: 1 } },
    { fields: { date: -1, format: 1 } },
    { fields: { createdAt: -1 } },
]);
tournamentSchema.index({
    location: 'text',
    notes: 'text',
    advancementCriteria: 'text'
});
exports.Tournament = (0, mongoose_1.model)('Tournament', tournamentSchema);
exports.default = exports.Tournament;
//# sourceMappingURL=Tournament.js.map