const LoadingAnimation = ({ message = "Loading...", type = "tractor", size = "md" }) => {
  const animations = {
    tractor: {
      icon: "🚜",
      message: message || "Plowing through data..."
    },
    harvest: {
      icon: "🌾",
      message: message || "Harvesting results..."
    },
    growth: {
      icon: "🌱",
      message: message || "Growing your insights..."
    },
    weather: {
      icon: "🌤️",
      message: message || "Checking weather conditions..."
    },
    analysis: {
      icon: "🔬",
      message: message || "Analyzing your data..."
    },
    oxcart: {
      icon: "🐂",
      message: message || "Processing your request..."
    },
    farm: {
      icon: "🏡",
      message: message || "Preparing your farm data..."
    },
    spinner: {
      icon: "",
      message: message || "Loading..."
    }
  }

  const currentAnimation = animations[type] || animations.tractor

  const sizeClasses = {
    sm: "text-lg",
    md: "text-3xl",
    lg: "text-5xl"
  }

  if (type === 'spinner') {
    return (
      <div className="flex items-center justify-center space-x-2">
        <div className={`${size === 'sm' ? 'loading-spinner-sm' : 'loading-spinner'}`}></div>
        <span className="text-gray-600">{currentAnimation.message}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-4">
        <div className={`${sizeClasses[size]} animate-bounce`}>
          {currentAnimation.icon}
        </div>
        <div className="text-center">
          <div className="text-gray-700 font-medium mb-2">
            {currentAnimation.message}
          </div>
          <div className="flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-farm-green rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-farm-green rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-farm-green rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingAnimation
