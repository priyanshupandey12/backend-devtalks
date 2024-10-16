const mongoose = require('mongoose');

const connectionSchema = mongoose.Schema({
  fromuserId: {
    type: String,
    ref: 'User',
    required: true
  },
  toconnectionId: {
    type: String,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ['pending', 'accepted', 'rejected','blocked', 'unblocked', 'Interested', 'Not Interested','ignored'],
      message: `{VALUE} is not supported`,
    },
  }
}, {
  timestamps: true
});

connectionSchema.index({ fromuserId: 1, toconnectionId: 1 });

connectionSchema.pre('save', function (next) {
  const connectionRequest = this;
  const fromUserId = connectionRequest.fromuserId.toString();
    const toConnectionId = connectionRequest.toconnectionId.toString();
    
    if (fromUserId === toConnectionId) {
        return next(new Error('fromuserId and toconnectionId cannot be the same'));
    }
  next();
});

const Connection=mongoose.model('Connection',connectionSchema);
module.exports=Connection;


