require "net/http"
require "json"

class BitcoinController < ApplicationController
  # ===============================
  # PREÇO ATUAL
  # ===============================
  def show
    price_data = fetch_bitcoin_price

    render json: {
      usd: price_data["usd"],
      brl: price_data["brl"],
      eur: price_data["eur"],
      updated_at: Time.now.strftime("%d/%m/%Y %H:%M:%S")
    }
  end

  # ===============================
  # HISTÓRICO POR DIAS (30, 90, 365)
  # ===============================
  def history_monthly
    days = params[:days] || 365

    url = "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=#{days}"
    uri = URI(url)
    response = Net::HTTP.get_response(uri)

    unless response.is_a?(Net::HTTPSuccess)
      render json: { error: "Erro HTTP: #{response.code}" }, status: :bad_gateway
      return
    end

    data = JSON.parse(response.body)
    prices = data["prices"]

    labels = prices.map do |p|
      Time.at(p[0] / 1000).strftime("%d/%m/%Y")
    end

    values = prices.map { |p| p[1].round(2) }

    render json: { labels: labels, prices: values }

  rescue StandardError => e
    render json: { error: e.message }, status: :bad_gateway
  end

  private

  def fetch_bitcoin_price
    url = "https://api.coingecko.com/api/v3/coins/bitcoin"
    uri = URI(url)
    response = Net::HTTP.get_response(uri)

    raise "Erro HTTP: #{response.code}" unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)

    {
      "usd" => data.dig("market_data", "current_price", "usd"),
      "brl" => data.dig("market_data", "current_price", "brl"),
      "eur" => data.dig("market_data", "current_price", "eur")
    }
  end
end
