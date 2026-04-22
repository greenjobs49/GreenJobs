const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    profilePicture: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please enter a valid email",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
    },

    mobile: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["jobseeker", "recruiter", "business", "admin"],
      required: [true, "Role is required"],
    },

    isVerified: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
    },

    profileCompleted: { type: Boolean, default: false },
    profileProgress: { type: Number, default: 0, min: 0, max: 100 },

    // ================= JOB SEEKER =================
    jobSeekerProfile: {
      firstName: { type: String, trim: true, maxlength: 50 },
      lastName: { type: String, trim: true, maxlength: 50 },
      fullName: { type: String, trim: true, maxlength: 100 },
      mobile: { type: String, default: "" },
      city: { type: String, trim: true, maxlength: 50 },
      pincode: { type: String, trim: true, maxlength: 10 },
      about: { type: String, trim: true, maxlength: 2000 },
      education: { type: String, trim: true, maxlength: 200 },
      experience: { type: String, trim: true, maxlength: 100 },
      accomplishments: { type: String, trim: true, maxlength: 2000 },
      skills: {
        type: [String],
        default: [],
        validate: {
          validator: (v) => v.length <= 20,
          message: "Maximum 20 skills allowed",
        },
      },
      resume: { type: String },
      linkedin: { type: String },
      portfolio: { type: String },
      expectedSalary: String,
      preferredRole: { type: String, trim: true, maxlength: 100 },
    },

    // ================= RECRUITER =================
    recruiterProfile: {
      companyName: { type: String, trim: true, maxlength: 100 },
      companyWebsite: { type: String },
      companyDescription: { type: String, trim: true, maxlength: 500 },
      companyLocation: { type: String, trim: true, maxlength: 100 },
      contactNumber: { type: String },
      companyLogo: { type: String },
      industryType: { type: String, trim: true, maxlength: 50 },
      linkedBusiness: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      verificationStatus: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: undefined,
},
verificationRequestedAt: { type: Date },
verificationReviewedAt:  { type: Date },
rejectionReason:         { type: String, default: "" },
    },

    // ================= BUSINESS =================
    businessProfile: {
      businessName: { type: String, trim: true, maxlength: 100 },
      category: { type: String, trim: true, maxlength: 50 },
      street:  { type: String, trim: true, maxlength: 200 },
      city:    { type: String, trim: true, maxlength: 50  },
      state:   { type: String, trim: true, maxlength: 50  },
      pincode: { type: String, trim: true, maxlength: 10  },
      address: { type: String, trim: true, maxlength: 500 },
      contactDetails: { type: String, trim: true, maxlength: 200 },
      description: { type: String, trim: true, maxlength: 1000 },
      images: {
        type: [String],
        default: [],
        validate: {
          validator: (v) => v.length <= 10,
          message: "Maximum 10 images allowed",
        },
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      verified: { type: Boolean, default: false },
      verificationDocuments: { type: [String], default: [] },
    },

    // ================= ADMIN =================
    adminProfile: {
      permissions: {
        type: [String],
        default: ["read", "write", "delete", "approve"],
      },
    },
  },
  {
    timestamps: true,
  }
);

//////////////////////////////////////////////////////
// INDEXES
//////////////////////////////////////////////////////

userSchema.index({ role: 1 });
userSchema.index({ "businessProfile.status": 1 });
userSchema.index({ "recruiterProfile.linkedBusiness": 1 });
userSchema.index({ "recruiterProfile.verificationStatus": 1 });
//////////////////////////////////////////////////////
// PROFILE PROGRESS CALCULATION
//////////////////////////////////////////////////////

userSchema.methods.calculateProfileProgress = function () {
  const profileMap = {
    jobseeker: this.jobSeekerProfile,
    recruiter: this.recruiterProfile,
    business: this.businessProfile,
  };

  const requiredFieldsMap = {
    jobseeker: [
      "firstName",
      "lastName",
      "mobile",
      "city",
      "pincode",
      "about",
      "education",
      "resume",
    ],
    recruiter: [
      "companyName",
      "companyWebsite",
      "contactNumber",
      "companyDescription",
      "companyLocation",
      "industryType",
      "companyLogo",
    ],
    business: [
      "businessName",
      "category",
      "contactDetails",
      "address",
      "description",
    ],
  };

  const profile = profileMap[this.role] || {};
  const requiredFields = requiredFieldsMap[this.role] || [];

  if (!requiredFields.length) {
    this.profileProgress = 0;
    this.profileCompleted = false;
    return;
  }

  const completedFields = requiredFields.filter((field) => {
    const value = profile?.[field];
    if (Array.isArray(value)) return value.length > 0;
    return value && value.toString().trim() !== "";
  }).length;

  this.profileProgress = Math.round(
    (completedFields / requiredFields.length) * 100
  );

  this.profileCompleted = this.profileProgress >= 80;
};

//////////////////////////////////////////////////////
// SAFE PRE-SAVE MIDDLEWARE (NO next)
//////////////////////////////////////////////////////

userSchema.pre("save", async function () {
  if (
    this.isModified("jobSeekerProfile") ||
    this.isModified("recruiterProfile") ||
    this.isModified("businessProfile")
  ) {
    this.calculateProfileProgress();
  }
});

userSchema.statics.findByRole = function (role) {
  return this.find({ role }).select("-password");
};

userSchema.statics.getApprovedBusinesses = function () {
  return this.find({
    role: "business",
    "businessProfile.status": "approved",
  }).select("name businessProfile profilePicture");
};

userSchema.statics.getBusinessById = function (businessId) {
  return this.findById(businessId).select("businessProfile name profilePicture");
};

module.exports = mongoose.model("User", userSchema);