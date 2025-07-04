// import React, { useState } from 'react';

// // **ARROW FUNCTIONS EXPLAINED**
// // Traditional function: function myFunction() { }
// // Arrow function: const myFunction = () => { }
// // Arrow functions are shorter and have different 'this' behavior

// const App = () => {
//   // **useState HOOK EXPLAINED**
//   // useState is a React hook that lets us add state to functional components
//   // It returns an array with 2 elements: [currentValue, setterFunction]
//   // We use DESTRUCTURING to extract these values
  
//   const [currentStep, setCurrentStep] = useState(1);
//   const [formData, setFormData] = useState({
//     // This is an OBJECT - a collection of key-value pairs
//     firstName: '',
//     lastName: '',
//     email: '',
//     phone: '',
//     skills: [],
//     experience: '',
//     subscribe: false
//   });
  
//   // **ARRAY for storing validation errors**
//   const [errors, setErrors] = useState({});

//   // **ARROW FUNCTION with parameters**
//   // This function takes 'step' as a parameter and validates the form
//   const validateStep = (step) => {
//     // **OBJECT to store new errors**
//     const newErrors = {};
    
//     // **CONDITIONAL STATEMENTS (if/else)**
//     if (step === 1) {
//       // **LOGICAL OPERATORS**
//       // ! means "NOT" - so !formData.firstName means "if firstName is empty"
//       if (!formData.firstName) {
//         newErrors.firstName = 'First name is required';
//       }
//       if (!formData.lastName) {
//         newErrors.lastName = 'Last name is required';
//       }
//     }
    
//     if (step === 2) {
//       // **REGULAR EXPRESSIONS (RegEx) for email validation**
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!formData.email || !emailRegex.test(formData.email)) {
//         newErrors.email = 'Valid email is required';
//       }
//       if (!formData.phone) {
//         newErrors.phone = 'Phone number is required';
//       }
//     }
    
//     if (step === 3) {
//       // **ARRAY LENGTH property**
//       if (formData.skills.length === 0) {
//         newErrors.skills = 'Please select at least one skill';
//       }
//     }
    
//     // **Object.keys() METHOD**
//     // Object.keys() returns an array of object's property names
//     const hasErrors = Object.keys(newErrors).length > 0;
    
//     setErrors(newErrors);
//     // **RETURN STATEMENT with boolean**
//     // Returns true if no errors, false if there are errors
//     return !hasErrors;
//   };

//   // **ARROW FUNCTION for handling input changes**
//   const handleInputChange = (e) => {
//     // **DESTRUCTURING from event target**
//     // We extract name, value, type, and checked from the input element
//     const { name, value, type, checked } = e.target;
    
//     // **FUNCTION to update state**
//     // We use a callback function with 'prev' parameter (previous state)
//     setFormData(prev => ({
//       // **SPREAD OPERATOR (...)**
//       // ...prev copies all existing properties from previous state
//       ...prev,
//       // **COMPUTED PROPERTY NAME with TERNARY OPERATOR**
//       // [name] uses the variable as property name
//       // condition ? valueIfTrue : valueIfFalse
//       [name]: type === 'checkbox' ? checked : value
//     }));
    
//     // **CONDITIONAL property deletion**
//     // If user fixes an error, remove it from errors object
//     if (errors[name]) {
//       // **OBJECT DESTRUCTURING with REST OPERATOR**
//       // We extract the property to remove and keep the rest
//       const { [name]: removedError, ...restErrors } = errors;
//       setErrors(restErrors);
//     }
//   };

//   // **ARROW FUNCTION for handling skill selection**
//   const handleSkillChange = (skill) => {
//     setFormData(prev => {
//       // **ARRAY METHODS: includes() and filter()**
//       const currentSkills = prev.skills;
//       const isSelected = currentSkills.includes(skill);
      
//       let newSkills;
//       if (isSelected) {
//         // **FILTER METHOD** - creates new array excluding the skill
//         newSkills = currentSkills.filter(s => s !== skill);
//       } else {
//         // **SPREAD OPERATOR with arrays** - adds new skill to existing array
//         newSkills = [...currentSkills, skill];
//       }
      
//       return {
//         ...prev,
//         skills: newSkills
//       };
//     });
//   };

//   // **ARROW FUNCTION for navigation**
//   const nextStep = () => {
//     if (validateStep(currentStep)) {
//       // **MATH operations** - adding 1 to move to next step
//       setCurrentStep(prev => prev + 1);
//     }
//   };

//   const prevStep = () => {
//     // **MATH operations** - subtracting 1 to go to previous step
//     setCurrentStep(prev => prev - 1);
//   };

//   // **ARROW FUNCTION for form submission**
//   const handleSubmit = () => {
//     if (validateStep(4)) {
//       // **JSON.stringify()** - converts JavaScript object to JSON string
//       alert('Form submitted successfully!\n\nData:\n' + JSON.stringify(formData, null, 2));
//     }
//   };

//   // **COMPONENT FUNCTION with DESTRUCTURING parameters**
//   const InputField = ({ label, name, type = 'text', error, ...props }) => {
//     // **RETURN JSX with TEMPLATE LITERALS**
//     return (
//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           {label}
//         </label>
//         <input
//           type={type}
//           name={name}
//           value={formData[name] || ''}
//           onChange={handleInputChange}
//           // **TEMPLATE LITERALS with CONDITIONAL CLASS NAMES**
//           // Backticks (`) allow us to embed expressions with ${}
//           className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
//             error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
//           }`}
//           // **SPREAD OPERATOR for passing additional props**
//           {...props}
//         />
//         {/* **CONDITIONAL RENDERING with && operator** */}
//         {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
//       </div>
//     );
//   };

//   // **COMPONENT FUNCTION for skill buttons**
//   const SkillButton = ({ skill, isSelected, onClick }) => (
//     <button
//       type="button"
//       onClick={() => onClick(skill)}
//       // **TEMPLATE LITERALS for dynamic styling**
//       className={`px-4 py-2 rounded-lg border-2 transition-colors ${
//         isSelected 
//           ? 'bg-blue-500 text-white border-blue-500' 
//           : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
//       }`}
//     >
//       {skill}
//     </button>
//   );

//   // **ARRAY of skills** - used for mapping over
//   const availableSkills = ['JavaScript', 'React', 'Python', 'Java', 'CSS', 'HTML', 'Node.js', 'SQL'];

//   // **FUNCTION to render different steps**
//   const renderStep = () => {
//     // **SWITCH STATEMENT** - alternative to multiple if/else
//     switch (currentStep) {
//       case 1:
//         return (
//           <div>
//             <h2 className="text-2xl font-bold mb-6 text-center">Personal Information</h2>
//             <InputField 
//               label="First Name" 
//               name="firstName" 
//               error={errors.firstName}
//               placeholder="Enter your first name"
//             />
//             <InputField 
//               label="Last Name" 
//               name="lastName" 
//               error={errors.lastName}
//               placeholder="Enter your last name"
//             />
//           </div>
//         );
      
//       case 2:
//         return (
//           <div>
//             <h2 className="text-2xl font-bold mb-6 text-center">Contact Information</h2>
//             <InputField 
//               label="Email" 
//               name="email" 
//               type="email"
//               error={errors.email}
//               placeholder="Enter your email"
//             />
//             <InputField 
//               label="Phone" 
//               name="phone" 
//               type="tel"
//               error={errors.phone}
//               placeholder="Enter your phone number"
//             />
//           </div>
//         );
      
//       case 3:
//         return (
//           <div>
//             <h2 className="text-2xl font-bold mb-6 text-center">Skills Selection</h2>
//             <p className="mb-4 text-gray-600">Select your skills:</p>
//             {/* **MAP METHOD** - transforms array into JSX elements */}
//             <div className="grid grid-cols-2 gap-3 mb-4">
//               {availableSkills.map((skill) => (
//                 <SkillButton
//                   // **KEY PROP** - required for React list items
//                   key={skill}
//                   skill={skill}
//                   // **INCLUDES METHOD** - checks if array contains element
//                   isSelected={formData.skills.includes(skill)}
//                   onClick={handleSkillChange}
//                 />
//               ))}
//             </div>
//             {/* **CONDITIONAL ERROR DISPLAY** */}
//             {errors.skills && <p className="text-red-500 text-sm">{errors.skills}</p>}
//           </div>
//         );
      
//       case 4:
//         return (
//           <div>
//             <h2 className="text-2xl font-bold mb-6 text-center">Experience & Preferences</h2>
//             <div className="mb-4">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Experience Level
//               </label>
//               <select
//                 name="experience"
//                 value={formData.experience}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
//               >
//                 <option value="">Select experience level</option>
//                 <option value="beginner">Beginner (0-1 years)</option>
//                 <option value="intermediate">Intermediate (2-5 years)</option>
//                 <option value="advanced">Advanced (5+ years)</option>
//               </select>
//             </div>
            
//             <div className="mb-4">
//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   name="subscribe"
//                   checked={formData.subscribe}
//                   onChange={handleInputChange}
//                   className="mr-2"
//                 />
//                 <span className="text-sm text-gray-700">Subscribe to newsletter</span>
//               </label>
//             </div>
//           </div>
//         );
      
//       // **DEFAULT CASE** in switch statement
//       default:
//         return <div>Invalid step</div>;
//     }
//   };

//   // **MAIN COMPONENT RETURN**
//   return (
//     <div className="min-h-screen bg-gray-100 py-8">
//       <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
//         {/* **PROGRESS BAR using inline styles and calculations** */}
//         <div className="mb-8">
//           <div className="flex justify-between text-sm text-gray-500 mb-2">
//             <span>Step {currentStep} of 4</span>
//             <span>{Math.round((currentStep / 4) * 100)}%</span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2">
//             <div 
//               className="bg-blue-500 h-2 rounded-full transition-all duration-300"
//               // **INLINE STYLES with JavaScript expressions**
//               style={{ width: `${(currentStep / 4) * 100}%` }}
//             ></div>
//           </div>
//         </div>

//         {/* **FUNCTION CALL to render current step** */}
//         {renderStep()}

//         {/* **NAVIGATION BUTTONS with CONDITIONAL RENDERING** */}
//         <div className="flex justify-between mt-8">
//           {/* **LOGICAL AND (&&) for conditional rendering** */}
//           {currentStep > 1 && (
//             <button
//               onClick={prevStep}
//               className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
//             >
//               Previous
//             </button>
//           )}
          
//           {/* **TERNARY OPERATOR for conditional content** */}
//           {currentStep < 4 ? (
//             <button
//               onClick={nextStep}
//               className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ml-auto"
//             >
//               Next
//             </button>
//           ) : (
//             <button
//               onClick={handleSubmit}
//               className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors ml-auto"
//             >
//               Submit
//             </button>
//           )}
//         </div>

//         {/* **DEVELOPMENT DEBUG INFO - shows current form data** */}
//         <div className="mt-8 p-4 bg-gray-50 rounded-lg">
//           <h3 className="font-bold text-sm mb-2">Current Form Data (Debug):</h3>
//           {/* **JSON.stringify with formatting** */}
//           <pre className="text-xs text-gray-600 overflow-auto">
//             {JSON.stringify(formData, null, 2)}
//           </pre>
//         </div>
//       </div>
//     </div>
//   );
// };

// // **DEFAULT EXPORT** - makes this component available for import
// export default App;
