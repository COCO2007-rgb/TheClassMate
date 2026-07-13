import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Phone, Mail, Award, ArrowRight, CheckCircle } from 'lucide-react';

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const batchCodeParam = searchParams.get('code') || '';

  const [batch, setBatch] = useState(null);
  const [loadingBatch, setLoadingBatch] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('');
  const [school, setSchool] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBatchInfo = async () => {
      if (!batchCodeParam) {
        setLoadingBatch(false);
        return;
      }
      try {
        const response = await api.get(`/public/batch/${batchCodeParam}/`);
        setBatch(response.data);
      } catch (err) {
        setError('Invalid or expired batch invite code.');
      } finally {
        setLoadingBatch(false);
      }
    };
    fetchBatchInfo();
  }, [batchCodeParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessData(null);
    setSubmitting(true);

    if (!name || !mobile || !password) {
      setError('Student Name, Contact Mobile, and password are required.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await api.post('/public/register-student/', {
        batch_code: batchCodeParam,
        name,
        father_name: fatherName,
        mother_name: motherName,
        mobile,
        whatsapp,
        dob,
        gender,
        blood_group: bloodGroup,
        school,
        address,
        email,
        password
      });

      setSuccessData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingBatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#14213D] text-white">
        <span className="text-xs font-semibold text-gray-400 animate-pulse">Resolving batch invitation...</span>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#14213D] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#14213D]/90 border border-gray-800 rounded-2xl p-8 text-center space-y-6"
        >
          <div className="inline-flex p-3 rounded-full bg-green-500/10 text-green-500">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">Registration Successful!</h2>
          <div className="p-4 bg-primary/40 border border-gray-800 rounded-lg text-xs text-left space-y-2 text-gray-300">
            <p>Your student ID is: <span className="font-bold text-accent font-mono">{successData.student_id}</span></p>
            <p>Your portal email is: <span className="font-bold text-white">{successData.email}</span></p>
            <p className="mt-2 text-[10px] text-gray-400 italic">
              {successData.password_note}
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-accent hover:opacity-90 text-primary font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Proceed to Parent Portal Sign In</span>
            <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#14213D] py-16 px-4 flex items-center justify-center relative overflow-hidden">
      {/* Top Left Name and Logo */}
      <div className="absolute top-6 left-6 flex items-center space-x-2.5 z-20">
        <img src="/logo.jpg" alt="Logo" className="w-7 h-7 rounded-full border border-gray-700 object-cover" />
        <span className="font-bold text-white tracking-wider text-xs font-sans">TheClassMate</span>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(252,163,17,0.1),transparent_70%)] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#14213D]/95 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl p-8 relative z-10 text-left"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-accent/10 text-accent mb-3">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {batch?.coaching_center_name || 'Apex Coaching Academy'}
          </h2>
          <p className="text-[10px] text-accent font-extrabold uppercase tracking-widest mt-1">
            Student Self-Enrollment
          </p>
          {batch ? (
            <p className="text-xs text-gray-400 mt-2">
              You are enrolling in: <span className="font-bold text-accent">{batch.name}</span> ({batch.subject})
            </p>
          ) : (
            <p className="text-xs text-red-400 mt-2 font-bold">
              Warning: Invite batch code parameter not resolved or expired.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-semibold text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Student Profile Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Student Name *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <User size={14} />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Mobile Contact *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Phone size={14} />
                </span>
                <input
                  type="text"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Father's Name</label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full px-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Mother's Name</label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                className="w-full px-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">WhatsApp Mobile</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Blood Group</label>
              <input
                type="text"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">School Name</label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full px-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Parent Portal Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
            />
          </div>

          <hr className="border-gray-800 my-4" />

          <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Account Password</h3>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Select Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !batch}
            className="w-full mt-6 py-2.5 bg-accent hover:opacity-90 text-primary font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>Submit Registration Details</span>
            <ArrowRight size={14} />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
