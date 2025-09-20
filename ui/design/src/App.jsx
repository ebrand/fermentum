import { useState } from 'react'
import Header from './components/Header'
import ColorPalette from './components/ColorPalette'
import Typography from './components/Typography'
import Buttons from './components/Buttons'
import Forms from './components/Forms'
import Cards from './components/Cards'
import Layout from './components/Layout'
import Administration from './components/Administration'
import {
  UsersIcon,
  Cog8ToothIcon,
  FireIcon,
  CircleStackIcon,
  CodeBracketSquareIcon,
  CubeTransparentIcon,
  DocumentIcon,
  LifebuoyIcon
} from '@heroicons/react/24/outline'

function App() {

  const [activeSection, setActiveSection] = useState('colors')
  const sections = [
    { id: 'colors', name: 'Colors', component: ColorPalette },
    { id: 'typography', name: 'Typography', component: Typography,
      subSections: [
        { id:'type-one', name: 'Headings', icon: FireIcon },
        { id:'type-two', name: 'Body Text', icon: UsersIcon },
        { id:'type-three', name: 'Special Text Styles', icon: UsersIcon }
      ] },
    { id: 'buttons', name: 'Buttons', component: Buttons,
      subSections: [
        { id:'btn-one', name: 'Primary', icon: UsersIcon },
        { id:'btn-two', name: 'Secondary', icon: UsersIcon },
        { id:'btn-three', name: 'Outlined', icon: UsersIcon }
      ] },
    { id: 'forms', name: 'Forms', component: Forms,
      subSections: [
        { id:'forms-one', name: 'Primary', icon: CircleStackIcon },
        { id:'forms-two', name: 'Secondary', icon: CodeBracketSquareIcon },
      ] },
    { id: 'cards', name: 'Cards', component: Cards },
    { id: 'layout', name: 'Layout', component: Layout },
    { id: 'admin', name: 'Administration', component: Administration,
      subSections: [
        { id:'btn-one', name: 'Users', icon: UsersIcon },
        { id:'btn-two', name: 'Service Health', icon: Cog8ToothIcon },
      ] },
  ]
  const ActiveComponent = sections.find(s => s.id === activeSection)?.component
  return (
    <div className="h-screen bg-cyan-50 flex flex-col overflow-hidden">

      {/* Sticky Header */}
      <div className="sticky top-0 z-50">
        <Header />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 h-0">
        
        {/* Fixed Sidebar Navigation */}
        <nav className="w-64 bg-white border-r border-teal-700 fixed top-[100px] bottom-[0px] overflow-hidden z-40">
          <div className="h-full">
            <div className="flex flex-col">
              
              {/* Nav Buttons */}
              <div className="flex-1 p-6">
                <ul className="space-y-2">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full items-end flex uppercase text-left px-4 pb-2 pt-6 rounded-lg transition-colors ${
                          activeSection === section.id
                            ? 'bg-teal-600 text-white'
                            : 'bg-teal-200 text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                        }`}
                      >
                        <span className="flex-1">
                          {section.name}
                        </span>
                        { activeSection === section.id
                            ? (
                              <div className="flex-none text-white size-4 items-end pb-5">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 4.5 15 15m0 0V8.25m0 11.25H8.25" />
                                </svg>
                              </div>
                            )
                            : (
                              <div className="flex-none text-teal-700 size-4 items-end pb-5">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                                </svg>
                              </div>
                            )
                        }
                      </button>

                      { activeSection === section.id && section.subSections?.length > 0 && (
                          <div className="flex flex-col pt-3 justify-center">
                            {section.subSections?.map((subSection) => ( /* hover:border-teal-300 hover:border-dashed */
                              <button className="flex uppercase text-xs text-right border border-white hover:bg-teal-50 p-2 rounded-full">
                                  <div className="w-[18px] text-teal-900 flex-none ml-1">
                                    <subSection.icon strokeWidth={2} />
                                  </div>
                                  <span className="flex-1 mr-1">{subSection.name}</span>
                              </button>
                            ))}
                          </div>
                        )
                      }
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Help Links */}
              <div className="w-[230px] text-teal-700 p-6 space-y-6 mb-6 mx-3 text-xs fixed bottom-[48px] ">
                <div className="flex space-x-3">
                  <CubeTransparentIcon className="size-4 text-teal-400" />
                  <span>Privacy Policy</span>
                </div>
                <div className="flex space-x-3">
                  <DocumentIcon className="size-4 text-teal-400" />
                  <span>Terms & Conditions</span>
                </div>
                <div className="flex space-x-3">
                  <LifebuoyIcon className="size-4 text-teal-00" />
                  <span>Get Help</span>
                </div>
              </div>
              
              {/* Lower-Left Copyright "#0f766e" */}
              <div className="w-64 bg-teal-700 h-[48px] fixed bottom-[0px] flex items-center justify-center">
                <span className="text-teal-200 text-sm">
                  &copy; 2025, Fermentum
                </span>
              </div>

            </div>
          </div>
        </nav>
        
        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-scroll ml-64">
          <div className="p-8">
            <div className="max-w-6xl">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {sections.find(s => s.id === activeSection)?.name}
                </h1>
                <p className="text-gray-600">
                  Fermentum design system components and utilities for building brewery management interfaces.
                </p>
              </div>
              {ActiveComponent && <ActiveComponent />}
            </div>
          </div>
        </main>
        
      </div>
    </div>
  )
}
export default App