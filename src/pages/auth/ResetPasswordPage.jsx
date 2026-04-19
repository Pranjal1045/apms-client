import { use, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { KeyRound, Loader } from "lucide-react";
import { resetPassword } from "../../store/slices/authSlice";

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const {isUpdatingPassword} = useSelector(state => state.auth);
  const token = searchParams.get("token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({...prev, [name]: value}));  

    if(errors[name]){
      setErrors((prev) => ({...prev, [name]: ""}));
    };
  };

  const validateForm = () => {
    const newErrors = {};
    
    if(!formData.password){
      newErrors.password = "Password is required";
    }else if(formData.password.length < 8){
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if(!formData.confirmPassword){
      newErrors.confirmPassword = "Confirm Password is required";
    }else if(formData.password !== formData.confirmPassword){
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    if(!validateForm()){
      return;
    }

    try {
      await dispatch(
        resetPassword({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        })
      ).unwrap();

      navigate("/login");
    } catch (error) {
      setErrors({
        general: error || "Failed to reset password. Please try again",
      });
    }
  };
  return <>
  <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    <div className="max-w-md w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
          <KeyRound className=" w-8 h-8 text-white"/>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Reset Password</h1>
        <p className="text-slate-600 mt-2">Enter your new password below.</p>
      </div>
      {/* Reset Password Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {
            errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )
          }
   
      {/* New Password */}
        <div>
          <label className="label">New Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} className={`input ${errors.password ? "input-error" : ""}`} placeholder="Enter new password"/>
          {
            errors.password && (
              <p className="text-sm text-red-600 mt-1">{errors.password}</p>
            )
          }
        </div>


        {/* Confirm Password */}
        <div>
          <label className="label">Confirm Password</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`input ${errors.email ? "input-error" : ""}`} placeholder="Enter your confirm password"/>
          {
            errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.password}</p>
            )
          }
          </div>
         



{/* Submit Button */}
<button type="submit" disabled={isUpdatingPassword} className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
  {
    isUpdatingPassword ? (
      <div className="flex justify-center items-center">
        <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"/>
        Resetting...
      </div>
    ) : "Reset Password"
  }
</button>

        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Remember your password? <Link to={"/login"} className="text-blue-600 hover:text-blue-500 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  </div>
  
  
  </>;
};

export default ResetPasswordPage;
