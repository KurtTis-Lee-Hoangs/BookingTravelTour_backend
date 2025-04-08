import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyGoogleToken } from "../utils/verifyToken.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

// User registrantion
export const register = async (req, res) => {
  const { username, email, password } = req.body;
  // try {
  //   const existEmail = await User.findOne({email: email})
  //   if (existEmail) {
  //     return res
  //       .status(401)
  //       .json({ success: false, message: "Email is already registered." });
  //   }

  //   // if (!req.body.password) {
  //   if (!password) {
  //     return res
  //       .status(401)
  //       .json({ success: false, message: "Password is required" });
  //   }

  //   // hasing password
  //   const salt = await bcrypt.genSaltSync(10);
  //   // const hash = bcrypt.hashSync(req.body.password, salt);
  //   const hash = bcrypt.hashSync(password, salt);

  //   const newUser = new User({
  //     // username: req.body.username,
  //     // email: req.body.email,
  //     username,
  //     email,
  //     password: hash,
  //     //   password: req.body.password,
  //     photo: req.body.photo,
  //   });

  //   await newUser.save();

  //   const verificationToken = jwt.sign(
  //     { user: newUser._id },
  //     process.env.JWT_SECRET_KEY,
  //     { expiresIn: "1h" }
  //   );

  //   // Generate the verification link
  //   const verificationLink = `${req.protocol}://${req.get(
  //     "host"
  //   )}/api/v1/auth/verify-email/${verificationToken}`;
  //   // Send the verification email
  //   await sendVerificationEmail(email, verificationLink);

  //   res.status(200).json({
  //     success: true,
  //     message: "Successfully created. User registered successfully",
  //     message:
  //       "Account registered successfully! Please verify your email to activate your account.",
  //   });
  // } catch (err) {
  //   res.status(500).json({
  //     success: false,
  //     // message: "Failed to create. User registration failed. Try again",
  //     message: err.message,
  //   });
  // }

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      if (existingUser.isDelete) {
        // If the user is deleted, update their information
        existingUser.username = username;
        existingUser.password = await bcrypt.hash(password, 10);
        existingUser.photo = req.body.photo;
        existingUser.isDelete = false; // Mark the user as not deleted

        await existingUser.save();
        return res.status(200).json({
          success: true,
          message: "Successfully created. User registered successfully!",
        });
      } else {
        return res
          .status(401)
          .json({ success: false, message: "Email is already registered." });
      }
    }

    // If the email does not exist, proceed with registration
    if (!password) {
      return res
        .status(401)
        .json({ success: false, message: "Password is required" });
    }

    // Hash password
    const salt = await bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const newUser = new User({
      username,
      email,
      password: hash,
      photo: req.body.photo,
    });

    await newUser.save();

    // Generate verification token
    const verificationToken = jwt.sign(
      { user: newUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Generate the verification link
    const verificationLink = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/verify-email/${verificationToken}`;
    
    // Send verification email
    await sendVerificationEmail(email, verificationLink);

    res.status(200).json({
      success: true,
      message: "Account registered successfully! Please verify your email to activate your account.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// User login
export const login = async (req, res) => {
  const email = req.body.email;
  if (!req.body.password) {
    return res
      .status(401)
      .json({ success: false, message: "Password is required" });
  }

  try {
    const user = await User.findOne({ email });

    // if user doesn't exist
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isDelete) {
      return res.status(403).json({
        success: false,
        message: "This account has been deleted",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has not been activated",
      });
    }

    // if user is exist then check the password or compare the password
    const checkCorrectPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    // if password is incorrect
    if (!checkCorrectPassword) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password",
      });
    }

    const { password, role, ...rest } = user._doc;

    // create jwt token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15d" }
    );

    // set token in browser cookies aand send the response to the client
    res.cookie("accessToken", token, {
      httpOnly: true,
      exprires: token.expiresIn,
      // secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      // sameSite: "strict",
    });
    res.status(200).json({
      // success: true,
      // message: "User logged in successfully",
      token,
      data: { ...rest },
      // role,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
};

export const googleCallback = (req, res) => {
  // Tạo JWT sau khi xác thực thành công
  const token = jwt.sign(
    { id: req.user._id, email: req.user.email },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "1d" }
  );

  const redirectUrl = `http://localhost:3000/homepage`;
  res.redirect(redirectUrl);
};

export const googleLogin = async (req, res) => {
  const { credential } = req.body;
  try {
    const userData = await verifyGoogleToken(credential);
    // console.log(userData);

    const { sub: googleId, name: username, email, picture: avatar } = userData;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ googleId, username, email, avatar });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15d" }
    );

    // set token in browser cookies aand send the response to the client
    res.cookie("accessToken", token, {
      httpOnly: true,
      exprires: token.expiresIn,
      // secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      // sameSite: "strict",
    });


    // Tiếp tục xử lý đăng nhập và trả về token nếu thành công
    // res.status(200).json({ message: "Login successful", token: token, data: user });
    res
      .status(200)
      .json({
        message: "Login successful",
        token: token,
        data: user,
        role: user.role,
      });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // Find the account by the decoded ID
    const userId = await User.findById(decoded.user);
    if (!userId) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }
    // If the account is already verified
    if (userId.isActive) {
      return res
        .status(400)
        .json({ success: false, message: "Account already verified" });
    }
    // Set the account to verified
    userId.isActive = true;
    await userId.save();
    res.redirect(`http://localhost:3000/registration-success`);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Verification token has expired" });
    } else if (err.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid verification token" });
    }
    res.status(500).json({
      success: false,
      message: "An error occurred during verification.",
    });
  }
};
