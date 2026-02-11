Rails.application.routes.draw do
  get "/bitcoin", to: "bitcoin#show"
  get '/bitcoin/history_monthly', to: 'bitcoin#history_monthly'
end

