const mongoose = require('mongoose');

const cachedRepoSchema = new mongoose.Schema(
  {
    interest: {
      type: String,
      required: true,
      index: true
    },

    languages: {
      type: [String],
      default: []
    },

    repos: {
      type: Array,
      default: []
    },

    lastRefreshed: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);


cachedRepoSchema.index({ interest: 1, languages: 1 }, { unique: true });

module.exports = mongoose.model('CachedRepo', cachedRepoSchema);
