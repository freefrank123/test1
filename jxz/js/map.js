// 济小震 · 地图模块（高德地图集成）
// 使用 JS API Loader 加载高德地图
(function() {
  // 高德地图API Key
  const MAP_KEY = '612fd80f25eff14e8adb151a418b2493';
  
  // 地图实例（通过Loader加载后初始化）
  let AMap = null;
  
  // 模拟避难所数据（实际项目中应从后端获取）
  const SHELTER_DATA = [
    { id: 1, name: '济南市地震应急避难所（泉城广场）', lat: 36.6613, lng: 117.0343, address: '历下区泉城广场' },
    { id: 2, name: '济南市体育中心避难所', lat: 36.6487, lng: 116.9825, address: '市中区经十路' },
    { id: 3, name: '大明湖公园应急避难所', lat: 36.6697, lng: 117.0225, address: '历下区大明湖路' },
    { id: 4, name: '千佛山公园避难所', lat: 36.6440, lng: 117.0561, address: '历下区经十一路' },
    { id: 5, name: '槐荫广场应急避难所', lat: 36.6582, lng: 116.9612, address: '槐荫区经二路' }
  ];

  let mapInstance = null;
  let userMarker = null;
  let shelterMarkers = [];
  let currentUserLocation = null;

  // 加载高德地图API
  function loadMapAPI() {
    return new Promise((resolve, reject) => {
      if (window.AMapLoader) {
        AMapLoader.load({
          key: MAP_KEY,
          version: "2.0",
          plugins: ["AMap.ToolBar", "AMap.Scale", "AMap.MapType", "AMap.Marker", "AMap.InfoWindow"]
        })
        .then((amap) => {
          AMap = amap;
          resolve(amap);
        })
        .catch((e) => {
          console.error('高德地图加载失败:', e);
          reject(e);
        });
      } else {
        reject(new Error('AMapLoader 未加载'));
      }
    });
  }

  // 初始化地图
  async function initMap() {
    const mapContainer = document.getElementById('map-placeholder');
    if (!mapContainer) return;

    try {
      // 先加载地图API
      await loadMapAPI();
      
      // 创建地图实例
      mapInstance = new AMap.Map('map-placeholder', {
        zoom: 13,
        center: [117.0009, 36.6753], // 默认济南市区中心
        mapStyle: 'amap://styles/normal'
      });

      // 添加地图控件
      mapInstance.addControl(new AMap.ToolBar());
      mapInstance.addControl(new AMap.Scale());
      mapInstance.addControl(new AMap.MapType());

      // 显示避难所标记
      showShelters();

      // 绑定按钮事件
      bindEvents();
    } catch (e) {
      console.error('地图初始化失败:', e);
      mapContainer.innerHTML = '<i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444;"></i><p style="color: #ef4444; margin-top: 1rem;">地图加载失败，请检查网络连接</p>';
    }
  }

  // 显示避难所标记
  function showShelters() {
    shelterMarkers.forEach(marker => { mapInstance.remove(marker); });
    shelterMarkers = [];

    SHELTER_DATA.forEach(shelter => {
      const marker = new AMap.Marker({
        position: [shelter.lng, shelter.lat],
        title: shelter.name,
        icon: new AMap.Icon({
          size: new AMap.Size(36, 36),
          image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
          imageSize: new AMap.Size(36, 36)
        }),
        offset: new AMap.Pixel(-18, -18)
      });

      marker.on('click', function() {
        showShelterInfo(shelter);
      });

      shelterMarkers.push(marker);
    });

    mapInstance.add(shelterMarkers);
  }

  // 显示避难所详情
  function showShelterInfo(shelter) {
    let distanceInfo = '';
    if (currentUserLocation) {
      const distance = AMap.GeometryUtil.distance(
        [currentUserLocation.lng, currentUserLocation.lat],
        [shelter.lng, shelter.lat]
      );
      distanceInfo = `<div style="margin-top: 8px; color: #f97316; font-weight: 600;">距离：${(distance / 1000).toFixed(2)} 公里</div>`;
    }

    const infoWindow = new AMap.InfoWindow({
      content: `
        <div style="padding: 12px; min-width: 200px;">
          <h4 style="color: #3b6df0; margin-bottom: 8px; font-size: 14px;">${shelter.name}</h4>
          <p style="color: #666; font-size: 12px;">地址：${shelter.address}</p>
          ${distanceInfo}
          <button onclick="JiXiaoZhen.Map.navigateTo(${shelter.lat}, ${shelter.lng}, '${shelter.name}')" 
            style="margin-top: 12px; padding: 6px 12px; background: linear-gradient(135deg, #3b6df0, #7c3aed); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
            导航前往
          </button>
        </div>
      `,
      offset: new AMap.Pixel(0, -20)
    });

    infoWindow.open(mapInstance, [shelter.lng, shelter.lat]);
  }

  // 获取用户位置
  function getUserLocation() {
    const locateBtn = document.getElementById('locateBtn');
    if (locateBtn) locateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 定位中...';

    navigator.geolocation.getCurrentPosition(
      function(position) {
        currentUserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        if (userMarker) mapInstance.remove(userMarker);

        userMarker = new AMap.Marker({
          position: [currentUserLocation.lng, currentUserLocation.lat],
          title: '我的位置',
          icon: new AMap.Icon({
            size: new AMap.Size(40, 40),
            image: 'https://webapi.amap.com/theme/v1.3/markers/b/mark_r.png',
            imageSize: new AMap.Size(40, 40)
          }),
          offset: new AMap.Pixel(-20, -20)
        });

        mapInstance.add(userMarker);
        mapInstance.setCenter([currentUserLocation.lng, currentUserLocation.lat]);
        mapInstance.setZoom(15);

        const infoWindow = new AMap.InfoWindow({
          content: '<div style="padding: 8px; font-size: 12px;">您的当前位置</div>',
          offset: new AMap.Pixel(0, -25)
        });
        infoWindow.open(mapInstance, [currentUserLocation.lng, currentUserLocation.lat]);

        if (locateBtn) {
          locateBtn.innerHTML = '<i class="fas fa-check"></i> 定位成功';
          setTimeout(() => { locateBtn.innerHTML = '<i class="fas fa-crosshairs"></i> 定位我的位置'; }, 2000);
        }
      },
      function(error) {
        console.error('定位失败:', error);
        if (locateBtn) {
          locateBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> 定位失败';
          setTimeout(() => { locateBtn.innerHTML = '<i class="fas fa-crosshairs"></i> 定位我的位置'; }, 2000);
        }
        alert('无法获取您的位置，请检查定位权限设置');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  // 导航到避难所
  function navigateTo(lat, lng, name) {
    const navOptions = document.createElement('div');
    navOptions.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 12px; padding: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 1000; min-width: 280px;">
        <h4 style="margin-bottom: 16px; color: #333; text-align: center;">选择导航方式</h4>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button onclick="JiXiaoZhen.Map.openAMapApp(${lat}, ${lng}, '${name}'); JiXiaoZhen.Map.closeNavOptions()" 
            style="padding: 12px; background: #3b6df0; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
            使用高德地图APP导航
          </button>
          <button onclick="JiXiaoZhen.Map.openWebNav(${lat}, ${lng}, '${name}'); JiXiaoZhen.Map.closeNavOptions()" 
            style="padding: 12px; background: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 14px;">
            使用网页导航
          </button>
          <button onclick="JiXiaoZhen.Map.closeNavOptions()" 
            style="padding: 12px; background: transparent; color: #999; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
            取消
          </button>
        </div>
      </div>
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999;" onclick="JiXiaoZhen.Map.closeNavOptions()"></div>
    `;
    document.body.appendChild(navOptions);
  }

  function openAMapApp(lat, lng, name) {
    const url = `amapuri://route/plan/?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(name)}&dev=0&t=0`;
    window.location.href = url;
    setTimeout(() => { openWebNav(lat, lng, name); }, 2000);
  }

  function openWebNav(lat, lng, name) {
    const url = `https://uri.amap.com/navigation?to=${lat},${lng},${encodeURIComponent(name)}&mode=car&policy=1&src=mypage&coordinate=gaode&callnative=0`;
    window.open(url, '_blank');
  }

  function closeNavOptions() {
    document.querySelectorAll('div[style*="position: fixed"]').forEach(el => {
      if (el.style.background === 'rgba(0, 0, 0, 0.5)' || el.style.transform === 'translate(-50%, -50%)') {
        el.remove();
      }
    });
  }

  // 显示避难所列表
  function showShelterList() {
    let listHtml = '<h3 style="color: #3b6df0; margin-bottom: 12px;">周边避难所列表</h3>';
    
    SHELTER_DATA.forEach((shelter, index) => {
      let distance = '';
      if (currentUserLocation) {
        const dist = AMap.GeometryUtil.distance(
          [currentUserLocation.lng, currentUserLocation.lat],
          [shelter.lng, shelter.lat]
        );
        distance = ` - ${(dist / 1000).toFixed(2)}公里`;
      }
      
      listHtml += `
        <div style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; color: #333;">${index + 1}. ${shelter.name}</div>
            <div style="font-size: 12px; color: #999; margin-top: 4px;">${shelter.address}${distance}</div>
          </div>
          <button onclick="JiXiaoZhen.Map.navigateTo(${shelter.lat}, ${shelter.lng}, '${shelter.name}')" 
            style="padding: 6px 12px; background: linear-gradient(135deg, #3b6df0, #7c3aed); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
            导航
          </button>
        </div>
      `;
    });

    const listModal = document.createElement('div');
    listModal.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 12px; padding: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 1000; width: 90%; max-width: 400px; max-height: 70vh; overflow-y: auto;">
        ${listHtml}
        <button onclick="JiXiaoZhen.Map.closeListModal()" 
          style="margin-top: 16px; width: 100%; padding: 12px; background: #f5f5f5; color: #333; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
          关闭
        </button>
      </div>
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999;" onclick="JiXiaoZhen.Map.closeListModal()"></div>
    `;
    document.body.appendChild(listModal);
  }

  function closeListModal() {
    document.querySelectorAll('div[style*="max-width: 400px"], div[style*="background: rgba(0,0,0,0.5)"]').forEach(el => el.remove());
  }

  // 绑定事件
  function bindEvents() {
    document.getElementById('locateBtn')?.addEventListener('click', getUserLocation);
    document.getElementById('nearbyBtn')?.addEventListener('click', showShelterList);
  }

  // 暴露到全局
  window.JiXiaoZhen.Map = {
    init: initMap,
    getUserLocation: getUserLocation,
    navigateTo: navigateTo,
    openAMapApp: openAMapApp,
    openWebNav: openWebNav,
    closeNavOptions: closeNavOptions,
    showShelterList: showShelterList,
    closeListModal: closeListModal,
    loadMapAPI: loadMapAPI
  };
})();