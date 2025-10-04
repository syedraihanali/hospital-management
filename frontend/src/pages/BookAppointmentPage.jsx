import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

function BookAppointmentPage() {
  const { auth } = useContext(AuthContext);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableTimesForDate, setAvailableTimesForDate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [doctorName, setDoctorName] = useState('');
  const [selectedTimeID, setSelectedTimeID] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const timesResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/available_times`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });

        if (!timesResponse.ok) {
          throw new Error('Failed to fetch available time slots');
        }

        const timesData = await timesResponse.json();
        setAvailableTimes(timesData);
        const dates = [...new Set(timesData.map((slot) => slot.ScheduleDate))].sort();
        setUniqueDates(dates);

        const doctorsResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/doctors`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });

        if (!doctorsResponse.ok) {
          throw new Error('Failed to fetch doctors');
        }

        const doctorsData = await doctorsResponse.json();

        if (timesData.length > 0) {
          const doctorID = timesData[0].DoctorID;
          const doctor = doctorsData.find((doc) => doc.DoctorID === doctorID);
          setDoctorName(doctor ? doctor.FullName : 'Unknown Doctor');
        } else {
          setDoctorName('No Doctor Assigned');
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({ type: 'error', text: error.message });
        setLoading(false);
      }
    };

    if (auth.user && auth.token) {
      fetchData();
    } else {
      navigate('/signin');
    }
  }, [auth.token, auth.user, navigate]);

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    const filteredTimes = availableTimes.filter((slot) => slot.ScheduleDate === date);
    setAvailableTimesForDate(filteredTimes);
    setSelectedTimeID('');
  };

  const handleTimeChange = (e) => {
    setSelectedTimeID(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTimeID) {
      setMessage({ type: 'error', text: 'Please select a time slot to book.' });
      return;
    }

    setBooking(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/book_appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ availableTimeID: parseInt(selectedTimeID, 10) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }

      setMessage({ type: 'success', text: 'Appointment booked successfully!' });

      setTimeout(() => {
        navigate('/myprofile');
      }, 2000);
    } catch (error) {
      console.error('Error booking appointment:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to book appointment. Please try again.' });
    } finally {
      setBooking(false);
    }
  };

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-card backdrop-blur">
        <h1 className="text-3xl font-semibold text-slate-900">Book an Appointment</h1>

        {doctorName && (
          <div className="mt-3 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            Doctor: {doctorName}
          </div>
        )}

        {message.text && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-600'
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Loading available time slots...</p>
        ) : uniqueDates.length > 0 ? (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-slate-700">
              Select a Date
              <select
                id="dateSelect"
                value={selectedDate}
                onChange={handleDateChange}
                required
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
              >
                <option value="">-- Select a Date --</option>
                {uniqueDates.map((date) => (
                  <option key={date} value={date}>
                    {date} ({getDayOfWeek(date)})
                  </option>
                ))}
              </select>
            </label>

            {selectedDate && (
              <label className="block text-sm font-semibold text-slate-700">
                Select a Time Slot
                <select
                  id="timeSelect"
                  value={selectedTimeID}
                  onChange={handleTimeChange}
                  required
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="">-- Select a Time Slot --</option>
                  {availableTimesForDate.map((slot) => (
                    <option key={slot.AvailableTimeID} value={slot.AvailableTimeID}>
                      {`${slot.StartTime} - ${slot.EndTime}`}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="submit"
              disabled={booking}
              className="w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              {booking ? 'Booking...' : 'Book Appointment'}
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-slate-500">No available time slots at the moment. Please check back later.</p>
        )}
      </div>
    </div>
  );
}

export default BookAppointmentPage;
