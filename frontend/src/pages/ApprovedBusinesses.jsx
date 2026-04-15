import React, { useEffect, useState } from "react";
import Navbar from "../components/common/Navbar";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Eye, 
  Download, 
  Search, 
  Filter, 
  CheckCircle,
  TrendingUp,
  Users 
} from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../config/api";
export default function ApprovedBusinesses() {
  const { token } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    restaurants: 0,
    retail: 0,
    services: 0
  });

  useEffect(() => {
    fetchApprovedBusinesses();
  }, []);

  const fetchApprovedBusinesses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/api/profile/business/approved`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setBusinesses(res.data);
      calculateStats(res.data);
    } catch (err) {
      toast.error("Failed to fetch approved businesses");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const restaurants = data.filter(b => 
      b.businessProfile.category?.toLowerCase().includes("restaurant") ||
      b.businessProfile.category?.toLowerCase().includes("food")
    ).length;
    
    const retail = data.filter(b => 
      b.businessProfile.category?.toLowerCase().includes("retail") ||
      b.businessProfile.category?.toLowerCase().includes("shop")
    ).length;
    
    const services = data.filter(b => 
      b.businessProfile.category?.toLowerCase().includes("service") ||
      b.businessProfile.category?.toLowerCase().includes("salon")
    ).length;

    setStats({ total, restaurants, retail, services });
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = 
      business.businessProfile.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.businessProfile.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.businessProfile.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(business.businessProfile.category);

    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(businesses.map(b => b.businessProfile.category).filter(Boolean))];

  const exportData = () => {
    const data = filteredBusinesses.map(b => ({
      Name: b.businessProfile.businessName,
      Category: b.businessProfile.category,
      "Contact Details": b.businessProfile.contactDetails,
      Address: b.businessProfile.address,
      Description: b.businessProfile.description.substring(0, 100) + "...",
      Images: b.businessProfile.images?.length || 0
    }));

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `approved-businesses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Data exported successfully!");
  };

  if (loading) {
    return (
      <div>
        <Navbar title="Approved Businesses" />
        <div className="container" style={{ padding: "100px 0", textAlign: "center" }}>
          <div>Loading approved businesses...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Approved Businesses" />
      
      <div className="container">
        {/* Header & Stats */}
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2>Approved Businesses ({stats.total})</h2>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-secondary" onClick={fetchApprovedBusinesses}>
                🔄 Refresh
              </button>
              <button className="btn btn-primary" onClick={exportData}>
                <Download size={18} className="inline mr-2" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 24
          }}>
            <div className="card" style={{ textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#10b981" }}>
                {stats.total}
              </div>
              <div style={{ color: "#6b7280", fontSize: 14 }}>Total Approved</div>
            </div>
            <div className="card" style={{ textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#f59e0b" }}>
                {stats.restaurants}
              </div>
              <div style={{ color: "#6b7280", fontSize: 14 }}>Restaurants</div>
            </div>
            <div className="card" style={{ textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#3b82f6" }}>
                {stats.retail}
              </div>
              <div style={{ color: "#6b7280", fontSize: 14 }}>Retail</div>
            </div>
            <div className="card" style={{ textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#8b5cf6" }}>
                {stats.services}
              </div>
              <div style={{ color: "#6b7280", fontSize: 14 }}>Services</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: 250 }}>
              <Search size={18} style={{ position: "absolute", left: 14, top: 14, color: "#6b7280" }} />
              <input
                type="text"
                placeholder="Search businesses, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "12px 16px 12px 44px",
                  border: "1px solid #d1d5db",
                  borderRadius: 12,
                  width: "100%",
                  fontSize: 14
                }}
              />
            </div>

            {/* Category Filter */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                background: "#f9fafb",
                borderRadius: 8,
                border: "1px solid #e5e7eb"
              }}>
                <Filter size={16} />
                <span style={{ fontSize: 14 }}>Filter:</span>
              </div>
              {categories.slice(0, 6).map(cat => (
                <button
                  key={cat}
                  className={`category-filter ${selectedCategories.includes(cat) ? "active" : ""}`}
                  onClick={() => {
                    setSelectedCategories(prev => 
                      prev.includes(cat) 
                        ? prev.filter(c => c !== cat)
                        : [...prev, cat]
                    );
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: "1px solid #d1d5db",
                    background: selectedCategories.includes(cat) ? "#3b82f6" : "white",
                    color: selectedCategories.includes(cat) ? "white" : "#374151",
                    fontSize: 13,
                    fontWeight: selectedCategories.includes(cat) ? 600 : 400
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Businesses Grid */}
        {filteredBusinesses.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "80px 20px" }}>
            <Building2 size={64} className="text-gray-400 mb-4 mx-auto" />
            <h3>No approved businesses match your filters</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria.</p>
            <button className="btn btn-primary" onClick={() => {
              setSearchTerm("");
              setSelectedCategories([]);
            }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid-2" style={{ gap: 20 }}>
            {filteredBusinesses.map((b) => (
              <div key={b._id} className="card" style={{
                display: "flex",
                gap: 20,
                padding: 24,
                borderRadius: 16,
                border: "1px solid #e5e7eb"
              }}>
                {/* Image */}
                <div style={{ flexShrink: 0 }}>
                  {b.businessProfile.images?.[0] ? (
                    <img
                      src={b.businessProfile.images[0]}
                      alt={b.businessProfile.businessName}
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 12
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 120,
                      height: 120,
                      background: "#f3f4f6",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9ca3af"
                    }}>
                      <Building2 size={32} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: 20, 
                      fontWeight: 700,
                      color: "#1f2937"
                    }}>
                      {b.businessProfile.businessName}
                    </h3>
                    <div style={{
                      background: "#dcfce7",
                      color: "#166534",
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      APPROVED
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{
                      background: "#dbeafe",
                      color: "#1e40af",
                      padding: "3px 8px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {b.businessProfile.category}
                    </div>
                  </div>

                  <p style={{ 
                    marginBottom: 16, 
                    color: "#6b7280", 
                    lineHeight: 1.6,
                    fontSize: 14
                  }}>
                    {b.businessProfile.description || "No description available"}
                  </p>

                  <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                    {b.businessProfile.contactDetails && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Phone size={14} color="#6b7280" />
                        <span style={{ fontSize: 13 }}>{b.businessProfile.contactDetails}</span>
                      </div>
                    )}
                    {b.businessProfile.address && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <MapPin size={14} color="#6b7280" />
                        <span style={{ fontSize: 13, color: "#6b7280" }}>
                          {b.businessProfile.address.substring(0, 40)}...
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ 
                    display: "flex", 
                    gap: 8, 
                    justifyContent: "flex-end" 
                  }}>
                    <span style={{ 
                      color: "#6b7280", 
                      fontSize: 12 
                    }}>
                      {b.businessProfile.images?.length || 0} images
                    </span>
                    <button className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: 13 }}>
                      <Eye size={16} className="inline mr-1" />
                      View Public
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
