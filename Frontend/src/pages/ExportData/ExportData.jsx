import React, { useState, useEffect } from 'react';
import { Download, Settings, BarChart3, Save, TestTube, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import Sidebar from '../../components/layout/Sildebar';
import { export_sheet, get_mapping, update_mapping } from '../../services/exportService';

const ExportData = () => {
    const [mappings, setMappings] = useState({});
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [exportResult, setExportResult] = useState(null);

    const customerFields = [
        { key: 'full_name', label: 'Họ tên', required: true },
        { key: 'phone_number', label: 'Số điện thoại', required: true },
        { key: 'created_at', label: 'Ngày submit', optional: true },
        { key: 'course', label: 'Khóa học cần đăng ký', optional: true },
        { key: 'student_id', label: 'Cơ sở đăng ký học', optional: true },
        { key: 'address', label: 'Địa chỉ', optional: true },
        { key: 'email', label: 'Email', optional: true },
        { key: 'notes', label: 'Ghi chú', optional: true }
    ];

    // Load mapping khi component mount
    useEffect(() => {
        loadMapping();
    }, []);

    const loadMapping = async () => {
        try {
            setLoading(true);
            const response = await get_mapping();

            let mappingData = {};

            if (Array.isArray(response)) {
                response.forEach((col) => {
                    mappingData[col] = "";
                });
            } else if (response && Object.keys(response).length > 0) {
                mappingData = response;
            } else {
                ["A", "B", "C", "D", "E"].forEach((col) => {
                    mappingData[col] = "";
                });
            }

            setMappings(mappingData);
            showMessage('success', 'Đã tải danh sách cột từ Google Sheet');
        } catch (error) {
            showMessage('error', 'Lỗi khi tải mapping: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMappingChange = (column, field) => {
        setMappings(prev => ({ ...prev, [column]: field }));
    };

    const saveMapping = async () => {
        try {
            setLoading(true);
            const response = await update_mapping(mappings);
            showMessage('success', response.message || 'Lưu mapping thành công');
        } catch (error) {
            showMessage('error', 'Lỗi khi lưu mapping: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const exportToGoogleSheets = async () => {
        try {
            setExportLoading(true);
            const response = await export_sheet();
            if (response.success) {
                setExportResult(response);
                showMessage('success', `${response.message} (${response.count} bản ghi)`);
            } else {
                throw new Error('Không thể export dữ liệu');
            }
        } catch (error) {
            showMessage('error', 'Lỗi khi export: ' + error.message);
        } finally {
            setExportLoading(false);
        }
    };

    const showMessage = (type, content) => {
        setMessage({ type, content });
        setTimeout(() => {
            setMessage({ type: '', content: '' });
        }, 5000);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            showMessage('success', 'Đã copy link vào clipboard');
        }).catch(() => {
            showMessage('error', 'Không thể copy link');
        });
    };

    const openInNewTab = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const getFieldLabel = (fieldKey) => {
        const field = customerFields.find(f => f.key === fieldKey);
        return field ? field.label : fieldKey;
    };

    const getStatusColor = (field) => {
        const fieldInfo = customerFields.find(f => f.key === field);
        if (!field) return 'bg-gray-100';
        return fieldInfo?.required ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Sidebar />
            <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen overflow-auto">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center lg:text-left">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <BarChart3 className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                        Ánh xạ với Google Sheets
                                    </h1>
                                    <p className="text-gray-600 text-lg">
                                        Ánh xạ thủ công các trường thông tin với cột Google Sheets
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Message Display */}
                        {message.content && (
                            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 shadow-lg ${message.type === 'success'
                                ? 'bg-green-50 border-2 border-green-200 text-green-800'
                                : 'bg-red-50 border-2 border-red-200 text-red-800'
                                }`}>
                                {message.type === 'success'
                                    ? <CheckCircle className="w-6 h-6 flex-shrink-0" />
                                    : <AlertCircle className="w-6 h-6 flex-shrink-0" />
                                }
                                <span className="font-medium">{message.content}</span>
                            </div>
                        )}

                        {/* Warning */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-6 shadow-lg">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xl">⚠</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-900 mb-2">Lưu ý quan trọng</h3>
                                    <p className="text-blue-800 leading-relaxed">
                                        Bạn cần ánh xạ thủ công các trường thông tin với cột Google Sheets để đảm bảo dữ liệu được xuất chính xác.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4 mb-8">
                            <button
                                onClick={loadMapping}
                                disabled={loading}
                                className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                Tải columns từ Lead Sheet
                            </button>

                            <button
                                onClick={exportToGoogleSheets}
                                disabled={exportLoading}
                                className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-4 rounded-2xl hover:from-green-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                {exportLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                Export dữ liệu
                            </button>
                        </div>

                        {/* Export Result */}
                        {exportResult && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6 shadow-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-green-800 mb-1">Export thành công!</h3>
                                        <p className="text-green-700">
                                            Đã export <span className="font-bold">{exportResult.count}</span> bản ghi sang Google Sheets
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Setup Mapping Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Customer Information Fields */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <span className="text-2xl">📝</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Trường thông tin khách hàng</h3>
                                        <p className="text-purple-100 mt-1">Danh sách các trường dữ liệu</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {customerFields.map((field) => (
                                    <div key={field.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border hover:shadow-md transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <span className="text-purple-600 font-bold">{field.label.charAt(0)}</span>
                                            </div>
                                            <span className="font-semibold text-gray-800">{field.label}</span>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${field.required
                                            ? 'bg-red-100 text-red-700 border border-red-200'
                                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                            }`}>
                                            {field.required ? '🔴 Bắt buộc' : '🟡 Tùy chọn'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column Mapping */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <span className="text-2xl">📊</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Ánh xạ cột</h3>
                                        <p className="text-blue-100 mt-1">Ghép cột với trường dữ liệu</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {Object.keys(mappings).map((column) => (
                                    <div key={column} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="font-bold text-blue-600">{column}</span>
                                        </div>
                                        <select
                                            value={mappings[column]}
                                            onChange={(e) => handleMappingChange(column, e.target.value)}
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                                        >
                                            <option value="">-- Chọn trường --</option>
                                            {customerFields.map((field) => (
                                                <option key={field.key} value={field.key}>
                                                    {field.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Google Sheets Link */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Link Google Sheets</h3>
                                <p className="text-gray-600">Truy cập trực tiếp đến Google Sheets</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={"https://docs.google.com/spreadsheets/d/1eci4KfF4VNQop9j63mnaKys1N3g3gJ3bdWpsgEE4wJs/edit?usp=sharing"}
                                readOnly
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-700 focus:outline-none font-mono text-sm"
                            />
                            <button
                                onClick={() => openInNewTab("https://docs.google.com/spreadsheets/d/1eci4KfF4VNQop9j63mnaKys1N3g3gJ3bdWpsgEE4wJs/edit?usp=sharing")}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all font-semibold shadow-lg hover:shadow-xl"
                                title="Mở trong tab mới"
                            >
                                <ExternalLink className="w-5 h-5" />
                                Mở Sheet
                            </button>
                        </div>
                    </div>

                    {/* Mapping Table */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Bảng ánh xạ chi tiết</h3>
                                    <p className="text-gray-200 mt-1">Xem và chỉnh sửa ánh xạ</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-4 px-6 text-left font-bold text-gray-700 border-b">Cột Sheet</th>
                                        <th className="py-4 px-6 text-left font-bold text-gray-700 border-b">Trường ánh xạ</th>
                                        <th className="py-4 px-6 text-center font-bold text-gray-700 border-b">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(mappings).map((column) => {
                                        const mappedField = mappings[column];
                                        const fieldInfo = customerFields.find(f => f.key === mappedField);

                                        return (
                                            <tr key={column} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-6 border-b">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <span className="font-bold text-blue-600 text-sm">{column}</span>
                                                        </div>
                                                        <span className="font-medium">Cột {column}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 border-b">
                                                    <select
                                                        value={mappedField}
                                                        onChange={(e) => handleMappingChange(column, e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                                    >
                                                        <option value="">-- Chọn trường --</option>
                                                        {customerFields.map((field) => (
                                                            <option key={field.key} value={field.key}>
                                                                {field.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="py-4 px-6 text-center border-b">
                                                    {fieldInfo ? (
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${fieldInfo.required
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {fieldInfo.required ? '🔴 Bắt buộc' : '🟡 Tùy chọn'}
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">
                                                            ⚪ Chưa ánh xạ
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                        <button
                            onClick={saveMapping}
                            disabled={loading}
                            className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Lưu cấu hình
                        </button>

                        <button
                            onClick={loadMapping}
                            disabled={loading}
                            className="flex items-center gap-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-4 rounded-2xl hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TestTube className="w-5 h-5" />}
                            Kiểm tra kết nối
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportData;