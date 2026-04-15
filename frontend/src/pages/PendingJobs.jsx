import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../components/common/Navbar";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { 
  CheckCircle, XCircle, Clock, Briefcase, Building2, User, 
  RefreshCw, Loader2, Eye 
} from "lucide-react";
import API_BASE_URL from "../config/api";
const PendingJobs = () => {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState({});

  // 🔥 FIXED: Perfect fetch with DEBUG LOGS + ERROR HANDLING
  const fetchJobs = useCallback(async () => {
    if (!token) {
      console.log("❌ No token - cannot fetch jobs");
      return;
    }

    console.log("🔍 Fetching pending jobs for BUSINESS ID:", user?._id);
    
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_BASE_URL}/api/jobs/pending`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      });

      console.log("✅ FULL API RESPONSE:", response.data);
      console.log("✅ JOBS ARRAY:", response.data.jobs || response.data);
      
      // ✅ Handle both response formats
      const jobsData = response.data.jobs || response.data || [];
      setJobs(jobsData);
      
      if (jobsData.length === 0) {
        console.log("ℹ️ No pending jobs found");
        toast("No pending jobs at the moment");
      } else {
        console.log(`✅ Found ${jobsData.length} pending jobs`);
      }
      
    } catch (err) {
      console.error("❌ FETCH JOBS ERROR:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        code: err.code
      });
      
      if (err.response?.status === 403) {
        toast.error("❌ Access denied. Must be business owner.");
      } else if (err.response?.status === 401) {
        toast.error("🔐 Please login again");
      } else if (!err.response) {
        toast.error("🚫 Server not responding (localhost:5000)");
      } else {
        toast.error(err.response.data?.message || "Failed to load jobs");
      }
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [token, user?._id]);

  // ✅ Load on mount
  useEffect(() => {
    console.log("🎯 Component mounted - user:", user?._id, "token:", !!token);
    fetchJobs();
  }, [fetchJobs]);

  // ✅ MANUAL REFRESH - 30s interval
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing pending jobs...");
      fetchJobs();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleApprove = async (jobId) => {
    try {
      setApproving(prev => ({ ...prev, [jobId]: true }));
      
      await axios.patch(`${API_BASE_URL}/api/jobs/approve/${jobId}`, {
        status: 'approved'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("✅ Job approved and LIVE!");
      fetchJobs(); // ✅ Refresh immediately
    } catch (err) {
      console.error("Approve error:", err.response?.data);
      toast.error(err.response?.data?.message || "Approval failed");
    } finally {
      setApproving(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleReject = async (jobId) => {
    try {
      setApproving(prev => ({ ...prev, [jobId]: true }));
      
      await axios.patch(`${API_BASE_URL}/api/jobs/reject/${jobId}`, {
        status: 'rejected_business'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("❌ Job rejected");
      fetchJobs(); // ✅ Refresh immediately
    } catch (err) {
      console.error("Reject error:", err.response?.data);
      toast.error(err.response?.data?.message || "Rejection failed");
    } finally {
      setApproving(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending_business":
        return { text: "Pending Review", color: "#f59e0b", icon: <Clock size={18} /> };
      case "approved":
        return { text: "Live ✅", color: "#10b981", icon: <CheckCircle size={18} /> };
      case "rejected_business":
        return { text: "Rejected ❌", color: "#ef4444", icon: <XCircle size={18} /> };
      default:
        return { text: status, color: "#6b7280" };
    }
  };

  // ✅ Loading state
  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Business Dashboard - Pending Jobs" />
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-xl text-gray-600">Loading your pending jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Business Dashboard - Pending Jobs" />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* 🔥 HEADER WITH DEBUG INFO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4 bg-white p-6 rounded-2xl shadow-lg">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Pending Jobs <span className="text-2xl">({jobs.length})</span>
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              Review jobs from your linked recruiters
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                Business ID: {user?._id?.slice(-6) || "N/A"}
              </span>
            </p>
          </div>
          <button 
            onClick={fetchJobs}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            {loading ? "Loading..." : "Refresh Now"}
          </button>
        </div>

        {/* 🔥 EMPTY STATE WITH DEBUG */}
        {jobs.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-xl border-2 border-dashed border-gray-200">
            <Briefcase size={80} className="mx-auto mb-8 text-gray-300" />
            <h2 className="text-3xl font-bold text-gray-700 mb-4">No Pending Jobs</h2>
            <p className="text-xl text-gray-500 max-w-md mx-auto mb-8">
              Jobs with status "pending_business" for your business will appear here
            </p>
            <div className="space-y-2 text-sm text-gray-500 mb-8">
              <p>✅ Status checked: pending_business</p>
              <p>✅ Business ID: {user?._id?.slice(-6) || "Loading..."}</p>
              <p>✅ Token present: {token ? "✅" : "❌"}</p>
            </div>
            <button 
              onClick={fetchJobs}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold text-lg"
            >
              🔄 Check Again
            </button>
          </div>
        ) : (
          /* 🔥 JOBS GRID */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {jobs.map((job) => {
              console.log("🎨 Rendering job:", job._id, job.title); // DEBUG
              const statusBadge = getStatusBadge(job.status);
              return (
                <div key={job._id} className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group">
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3 pr-8">
                          {job.title}
                        </h2>
                        <div className="flex flex-wrap gap-3 mb-4">
                          <span className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 rounded-full font-semibold">
                            {statusBadge.icon}
                            {statusBadge.text}
                          </span>
                          {job.recruiter?.recruiterProfile?.companyName && (
                            <span className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-xl font-medium">
                              <User size={14} />
                              {job.recruiter.recruiterProfile.companyName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rest of your job card remains SAME */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                            <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                              📍
                            </div>
                            <div>
                              <p className="font-semibold text-gray-700 text-sm">Location</p>
                              <p className="text-lg">{job.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                            <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                              💼
                            </div>
                            <div>
                              <p className="font-semibold text-gray-700 text-sm">Type</p>
                              <p className="text-lg">{job.type}</p>
                            </div>
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                              <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                                💰
                              </div>
                              <div>
                                <p className="font-semibold text-gray-700 text-sm">Salary</p>
                                <p className="text-lg font-semibold text-green-700">{job.salary}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="p-4 bg-blue-50 rounded-2xl mb-4">
                          <p className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                            <User size={18} />
                            Recruiter: {job.recruiter?.name || "Unknown"}
                          </p>
                          {job.recruiter?.email && (
                            <p className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-xl">
                              📧 {job.recruiter.email}
                            </p>
                          )}
                        </div>

                        {job.skills?.length > 0 && (
                          <div>
                            <p className="font-semibold text-gray-700 mb-3">Skills Required:</p>
                            <div className="flex flex-wrap gap-2">
                              {job.skills.map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1.5 bg-indigo-100 text-indigo-800 text-sm rounded-full font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {job.description && (
                      <div className="mb-8 p-6 bg-gray-50 rounded-2xl border-l-4 border-blue-400">
                        <p className="font-semibold text-gray-800 mb-4">Job Description</p>
                        <p className="text-gray-700 leading-relaxed line-clamp-4">
                          {job.description}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => handleReject(job._id)}
                        disabled={approving[job._id]}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        {approving[job._id] ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Rejecting...</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={20} />
                            <span>Reject Job</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleApprove(job._id)}
                        disabled={approving[job._id]}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        {approving[job._id] ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Approving...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={20} />
                            <span>Approve & Go Live</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingJobs;
