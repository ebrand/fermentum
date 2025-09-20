import {
  BellIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

function Header() {
  return (
    <header >
      <div>
        <div className="flex justify-between h-[100px] border-b border-teal-700"> {/* border-b border-teal-700 border-dashed */}
          
          {/* Upper-Left Fermentum Logo "#0f766e" */}
          <div className="w-64 bg-teal-700 flex items-center space-x-3">
            <div className="mx-auto">
              <img src="/fermentum-logo.png" className="h-[60px]" />
            </div>
          </div>

          {/* Main Header "#99f6e4" */}
          <div className="flex flex-1 items-center justify-end space-x-4 pr-3 bg-teal-200">
            
            <div className="flex-1 mx-6 md:text-4xl sm:text-lg text-teal-800 font-semibold tracking-tight">
              (512) Brewing Company
            </div>

            {/* Notification Bell */}
            <button className="flex-none text-teal-900 font-medium p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-70 transition-all duration-200">
              <BellIcon className="w-8 h-8" strokeWidth={2} />
            </button>
            
            {/* User Profile Dropdown Menu "#2dd4bf" */}
            <div className="flex flex-none bg-teal-400 p-3 items-center rounded-full ">
              
              {/* Circle with Inits. or Profile Pic. */}
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                <span className="text-teal-700 text-xs font-bold">
                  EB
                </span>
              </div>
              
              {/* Name & E-mail */}
              <div className="flex-1 text-teal-900 mx-3 text-left">
                <div className="text-xs font-bold">ERIC BRAND</div>
                <div className="text-xs opacity-80">eric.d.brand@gmail.com</div>
              </div>
              
              {/* Chevron */}
              <ChevronDownIcon className="flex-1 size-5 text-white" strokeWidth={3} />
            
            </div>

          </div>
        </div>
      </div>
    </header>
  )
}
export default Header