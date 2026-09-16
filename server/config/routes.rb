Rails.application.routes.draw do
  mount ActionCable.server => "/cable"

  root "rails/health#show"
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :auth do
    post :register, to: "registrations#create"
    post :login, to: "sessions#create"
    delete :logout, to: "sessions#destroy"
  end

  resource :profile, only: [:show, :update, :destroy], controller: :users

  resources :devices, only: [:index, :show, :update], param: :code do
    member do
      post :attach
      delete :detach
    end
  end

  scope module: :devices do
    resources :measurements, only: [:index] do
      collection do
        get :latest
      end
    end
    resource :weather, only: [:show], controller: :weather
    resources :notifications, only: [:index, :update, :destroy]
    resources :watering_logs, only: [:index]
    resources :watering_schedules, only: [:index, :create, :update, :destroy]
    resource :fan, only: [:show, :update]
    resource :window, only: [:show, :update]
  end
end
